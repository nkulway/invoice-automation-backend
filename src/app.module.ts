import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigModuleOptions } from '@nestjs/config'
import { InvoicesModule } from './invoices/invoices.module'

const safeConfigModule = ConfigModule as {
  forRoot: (options?: ConfigModuleOptions<Record<string, any>>) => any
}
@Module({
  imports: [
    safeConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT as string, 10) || 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Auto-load all entities
      synchronize: true, // Disable in production!
    }),
    InvoicesModule,
  ],
})
export class AppModule {}
