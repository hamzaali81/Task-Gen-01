import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS — allow the Vite dev server and production frontend origins
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  });

  // Global validation pipe
  // - whitelist: strips unknown properties from DTOs
  // - forbidNonWhitelisted: throws 400 for unexpected properties
  // - transform: auto-converts primitive types (e.g. strings → numbers)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global HTTP exception filter — ensures consistent error response shape
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Event Budgeting API')
    .setDescription('Multi-tenant Event Budgeting Platform with AI Assistant')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'x-workspace-id', in: 'header' },
      'workspace-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📖 Swagger documentation:      http://localhost:${port}/api/docs\n`);
}
bootstrap();
