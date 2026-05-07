import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('admin_audit_logs')
export class AdminAuditLog extends BaseEntity {
  @Index()
  @Column({ name: 'admin_id', type: 'uuid' })
  adminId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Index()
  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;
  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ name: 'error_msg', type: 'text', nullable: true })
  errorMsg: string | null;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;
}
