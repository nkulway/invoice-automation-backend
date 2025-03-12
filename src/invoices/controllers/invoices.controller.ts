import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { InvoicesService } from '../services/invoices.service'
import { TextractService } from '../../textract/services/textract.service'
import { Invoice } from '../entities/invoice.entity'
import { CreateInvoiceDto } from '../dto/create-invoice.dto'
import { AnalyzeExpenseCommandOutput } from '@aws-sdk/client-textract'

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly textractService: TextractService,
  ) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Create the invoice record in the database
    const invoice = await this.invoicesService.create(createInvoiceDto)

    // After storing, call Textract to process the invoice image.
    try {
      const textractResult: AnalyzeExpenseCommandOutput =
        await this.textractService.analyzeInvoice(
          createInvoiceDto.s3Bucket,
          createInvoiceDto.documentKey,
        )
      console.log('Textract result:', textractResult)
    } catch (error) {
      console.error('Error processing invoice via Textract:', error)
      // Optionally, update the invoice record with an error status here.
    }

    return invoice
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
