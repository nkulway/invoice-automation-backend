import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Invoice } from './entities/invoice.entity'
import { InvoicesService } from './services/invoices.service'
import { InvoicesController } from './controllers/invoices.controller'
import { TextractModule } from '../textract/textract.module'

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), TextractModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
