import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { InvoicesService } from '../services/invoices.service'
import { Invoice } from '../entities/invoice.entity'

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() invoiceData: Partial<Invoice>): Promise<Invoice> {
    return this.invoicesService.create(invoiceData)
  }

  @Get()
  async findAll(): Promise<Invoice[]> {
    return this.invoicesService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Invoice> {
    return this.invoicesService.findOne(Number(id))
  }
}
