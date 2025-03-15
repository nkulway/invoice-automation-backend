import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AppDataSource } from './data-source'

async function bootstrap() {
  try {
    await AppDataSource.initialize()
    console.log('Data Source has been initialized!')

    const app = await NestFactory.create(AppModule)
    await app.listen(process.env.PORT || 3000)
    console.log(`Application is running on: ${await app.getUrl()}`)
  } catch (err) {
    console.error('Error during Data Source initialization:', err)
    process.exit(1) // Exit if the database connection fails
  }
}

bootstrap()
