import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiResponse,
  ValidationError,
} from '../interfaces/api-response.interface';

// واجهة داخلية لتمثيل بنية الاستجابة المتوقعة من NestJS
interface NestErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { statusCode, message, errors } =
      this.extractExceptionDetails(exception);

    this.logException(exception, request, statusCode);

    const body: ApiResponse<null> = {
      success: false,
      statusCode,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
      errors: errors ?? null,
    };

    response.status(statusCode).json(body);
  }

  private extractExceptionDetails(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: ValidationError[];
  } {
    // 1. التعامل مع أخطاء HttpException (أخطاء Nest المدمجة)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // التحقق مما إذا كانت الاستجابة كائناً (Object)
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as NestErrorResponse;

        // حالة: أخطاء الـ Validation (تكون مصفوفة في خاصية message)
        if (Array.isArray(res.message)) {
          return {
            statusCode,
            message: 'Validation failed',
            errors: this.parseValidationErrors(res.message),
          };
        }

        // حالة: خطأ HttpException مع رسالة نصية داخل الكائن
        return {
          statusCode,
          message:
            typeof res.message === 'string' ? res.message : exception.message,
        };
      }

      // حالة: الاستجابة نص بسيط (Plain string)
      return {
        statusCode,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exception.message,
      };
    }

    // 2. التعامل مع أخطاء الـ Error العادية (Runtime Errors)
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          exception.message || 'An unexpected internal server error occurred',
      };
    }

    // 3. حالة مجهولة تماماً
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected internal server error occurred',
    };
  }

  private parseValidationErrors(rawMessages: string[]): ValidationError[] {
    const errorsMap = new Map<string, string[]>();

    for (const msg of rawMessages) {
      const dotIndex = msg.indexOf('.');
      let field = 'general';
      let message = msg;

      // محاولة استخراج اسم الحقل (مثلاً: "email must be valid" -> field: email)
      const fieldMatch = msg.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+/);

      if (fieldMatch) {
        field = fieldMatch[1];
      } else if (dotIndex > 0) {
        field = msg.substring(0, dotIndex);
        message = msg.substring(dotIndex + 1);
      }

      const existing = errorsMap.get(field) || [];
      errorsMap.set(field, [...existing, message]);
    }

    return Array.from(errorsMap.entries()).map(([field, messages]) => ({
      field,
      messages,
    }));
  }

  private logException(
    exception: unknown,
    request: Request,
    statusCode: number,
  ): void {
    const logContext = {
      method: request.method,
      url: request.url,
      statusCode,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (statusCode >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : 'No stack trace';
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}`,
        stack,
        JSON.stringify(logContext),
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} → ${statusCode}`,
        JSON.stringify(logContext),
      );
    }
  }
}
