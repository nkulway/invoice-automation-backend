import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Invoice } from './entities/invoice.entity'
import { InvoicesService } from './services/invoices.service'
import { InvoicesController } from './controllers/invoices.controller'
import { TextractModule } from '../textract/textract.module'
import { SqsService } from 'src/sqs/services/sqs.service'
import { InvoiceLineItem } from './entities/invoice-line-item.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceLineItem]),
    TextractModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, SqsService],
})
export class InvoicesModule {}
