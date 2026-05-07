import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';

const logger = new Logger('AuditLog');

export function AuditLog(action: string, resource: string) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const original = descriptor.value as (
      this: { dataSource?: DataSource },
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = async function (
      this: { dataSource?: DataSource },
      ...args: unknown[]
    ) {
      const dataSource = this.dataSource;
      const adminId = extractAdminId(args);
      const startTime = Date.now();
      let success = true;
      let errorMsg: string | undefined;

      try {
        const result: unknown = await original.call(this, ...args);
        return result;
      } catch (err: unknown) {
        success = false;
        errorMsg = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const duration = Date.now() - startTime;

        if (dataSource) {
          void saveAuditLog(dataSource, {
            adminId: adminId ?? 'unknown',
            action,
            resource,
            resourceId: extractResourceId(args),
            success,
            errorMsg,
            durationMs: duration,
          });
        }

        logger.log(
          `[AUDIT] ${action} on ${resource} by ${adminId ?? 'unknown'} — ` +
            `${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`,
        );
      }
    };

    return descriptor;
  };
}

function extractAdminId(args: unknown[]): string | undefined {
  const last = args[args.length - 1];
  return typeof last === 'string' && last.length === 36 ? last : undefined;
}

function extractResourceId(args: unknown[]): string | undefined {
  const first = args[0];
  return typeof first === 'string' && first.length === 36 ? first : undefined;
}

async function saveAuditLog(
  dataSource: DataSource,
  data: {
    adminId: string;
    action: string;
    resource: string;
    resourceId: string | undefined;
    success: boolean;
    errorMsg: string | undefined;
    durationMs: number;
  },
): Promise<void> {
  try {
    const repo = dataSource.getRepository(AdminAuditLog);
    await repo.save(repo.create(data));
  } catch (err: unknown) {
    logger.error('Failed to save audit log', err);
  }
}
