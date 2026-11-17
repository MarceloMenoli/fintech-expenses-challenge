import {
  ArgumentsHost,
  CallHandler,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { Response } from 'express';
import { map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((result: unknown) => {
        if (result && typeof result === 'object' && 'meta' in result) return result;
        return { data: result ?? null };
      }),
    );
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let error = exception;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const code = error.code;
      if (code === 'P2002') error = new ConflictException('E-mail já cadastrado.');
      if (code === 'P2003')
        error = new ConflictException('Categoria vinculada a transações ou indisponível.');
      if (code === 'P2025') error = new NotFoundException('Recurso não encontrado.');
    }
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      const body = error.getResponse();
      const detail = typeof body === 'string' ? { message: body } : body;
      response
        .status(error.getStatus())
        .json({ statusCode: error.getStatus(), error: error.name, ...detail });
      return;
    }
    // Do not log request bodies, credentials, tokens, or database error details.
    this.logger.error(
      'Unexpected request failure',
      error instanceof Error ? error.name : 'UnknownError',
    );
    response.status(500).json({
      statusCode: 500,
      message: 'Erro interno. Tente novamente.',
      error: 'InternalServerError',
    });
  }
}
