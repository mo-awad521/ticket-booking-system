import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

// ─── Custom Decorators ───────────────────────────────────────────────────
export const RESPONSE_MESSAGE_KEY = 'response_message';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

// ─── Interceptor ─────────────────────────────────────────────────────────────

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>, // تم إضافة <T> هنا لتجنب any
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // قراءة الرسالة المخصصة
    const customMessage =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getClass()) ??
      this.getDefaultMessage(request.method, response.statusCode);

    return next.handle().pipe(
      map(
        (
          data: T, // تحديد أن البيانات هي من نوع T وليست any
        ) => this.buildResponse(data, customMessage, request, response),
      ),
    );
  }

  private buildResponse(
    data: T,
    message: string,
    request: Request,
    response: Response,
  ): ApiResponse<T> {
    // حل مشكلة enum comparison: تحويل القيمة دائماً لرقم (Number)
    const statusCode = Number(response.statusCode) || HttpStatus.OK;

    // for pagination
    // if (data && data.data && data.meta) {
    //   return {
    //     success: true,
    //     statusCode,
    //     message,
    //     data: data.data,
    //     meta: data.meta,
    //     timestamp: new Date().toISOString(),
    //     path: request.url,
    //   };
    // }

    return {
      success: true,
      statusCode,
      message: message,
      data: data ?? (null as unknown as T), // التعامل مع البيانات الفارغة بحذر مع النوع T
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private getDefaultMessage(method: string, statusCode: number): string {
    // تحويل statusCode لرقم صريح عند المقارنة لتجنب تحذير Enum
    if (Number(statusCode) === (HttpStatus.CREATED as number)) {
      return 'Resource created successfully';
    }

    const messages: Record<string, string> = {
      GET: 'Data fetched successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };

    return messages[method.toUpperCase()] ?? 'Operation completed successfully';
  }
}
