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
      `
<h2>🎟️ TicketFlow API</h2>

<p>
A modern <strong>Event Ticket Booking Platform</strong> built with
<strong>NestJS</strong> using a scalable, production-ready architecture.
</p>

<hr>

<h3>✨ Features</h3>

<ul>
  <li>🔐 JWT Authentication & Refresh Tokens</li>
  <li>👤 User & Profile Management</li>
  <li>🎫 Event & Ticket Type Management</li>
  <li>🛒 Reservation & Order Workflow</li>
  <li>💳 Secure Stripe Payment Integration</li>
  <li>📱 QR Ticket Generation & Validation</li>
  <li>📧 Email Notifications</li>
  <li>⚡ Redis Caching</li>
  <li>🧵 BullMQ Background Jobs</li>
  <li>📊 Analytics Dashboard</li>
  <li>🛠️ Admin Operations</li>
</ul>

<hr>

<h3>📦 Standard Response</h3>

<pre>{
  "success": true,
  "statusCode": 200,
  "message": "Request completed successfully.",
  "data": {},
  "timestamp": "2026-07-10T12:00:00.000Z",
  "path": "/api/events"
}</pre>

<hr>

<h3>🔑 Authentication</h3>

<p>
Most endpoints require a
<strong>JWT Bearer Token</strong>.
Click the <strong>Authorize</strong> button above and paste your access token.
</p>

<hr>

<h3>🧰 Technology Stack</h3>

<ul>
  <li>NestJS</li>
  <li>TypeScript</li>
  <li>TypeORM</li>
  <li>MySQL</li>
  <li>Redis</li>
  <li>BullMQ</li>
  <li>Stripe</li>
  <li>Cloudinary</li>
</ul>

<hr>

<h3>📚 API Modules</h3>

<ul>
  <li>Auth</li>
  <li>Users</li>
  <li>Events</li>
  <li>Event Staff</li>
  <li>Ticket Types</li>
  <li>Reservations</li>
  <li>Orders</li>
  <li>Payments</li>
  <li>Tickets</li>
  <li>Scanner</li>
  <li>Analytics</li>
</ul>

<hr>

<h3>👨‍💻 Author</h3>

<p>
<strong>Mohammad Alawad</strong><br>
Backend Developer specializing in scalable Node.js & NestJS applications.
</p>
`,
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
