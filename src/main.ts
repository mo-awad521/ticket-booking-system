import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/filters/transform.interceptor';
import { GlobalExceptionFilter } from './common/interceptors/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('TicketFlow API')
    .setDescription(
      'Backend API for TicketFlow — a full event ticket booking platform. ' +
        'Covers authentication, event & inventory management, reservations, ' +
        'orders, Stripe payments, QR ticket issuance, live analytics, and admin operations. ' +
        'All successful responses are wrapped in a unified envelope: ' +
        '`{ success, statusCode, message, data, timestamp, path }`.',
    )
    .setVersion('1.0.0')
    .setContact('Mohammad Alawad', 'https://github.com/mo-awad521', '')
    .addServer('https://myticket-ly.me', 'Production (Render)')
    .addServer('http://localhost:5000', 'Local Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token returned from /auth/login',
      },
      'access-token',
    )
    .addTag(
      'Auth',
      'Registration, email verification, login, refresh, sessions',
    )
    .addTag('Users', 'Profile, password, account status')
    .addTag('Events', 'Event lifecycle: draft → published → cancelled')
    .addTag('Event Staff', 'Assigning staff to events for scanning')
    .addTag('Ticket Types', 'Ticket inventory & pricing per event')
    .addTag('Reservations', 'Time-limited ticket holds')
    .addTag('Orders', 'Converting reservations into payable orders')
    .addTag('Payments', 'Stripe payment intent creation & confirmation')
    .addTag('Tickets', 'QR ticket issuance and retrieval')
    .addTag('Scanner', 'Event-staff ticket check-in')
    .addTag('Analytics', 'Per-event stats & realtime updates')
    .build();
    //     .addTag(
    //   'Admin',
    //   'Admin panel: users, events, orders, tickets, stats, audit logs',
    // )

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
    customSiteTitle: 'TicketFlow API Docs',
  });

  const reflector = app.get(Reflector);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.enableCors({
    origin: ['http://localhost:5173', 'https://myticket-ly.me'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
