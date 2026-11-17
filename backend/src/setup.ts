import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter, ResponseInterceptor } from './common/http';

export function validateEnvironment() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL is required');
  const ttl = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600);
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400)
    throw new Error('JWT_EXPIRES_IN_SECONDS must be between 60 and 86400');
}

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
