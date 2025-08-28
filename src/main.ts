import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  const globalPrefix = 'api/v1/waradata';
  app.setGlobalPrefix(globalPrefix);

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('WaraData API')
    .setDescription('Bill Payment and Savings Fintech API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerPath = `${globalPrefix}/docs`;
  SwaggerModule.setup(swaggerPath, app, document);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`✅ App is running on http://localhost:${port}/${swaggerPath}`);
}
bootstrap();