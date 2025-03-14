import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from '../entities/invoice.entity'
import { CreateInvoiceDto } from '../dto/create-invoice.dto'
import { TextractParserService } from '../../textract/services/textract-parser.service'
import { TextractService } from '../../textract/services/textract.service'

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private readonly textractService: TextractService,
    private readonly textractParserService: TextractParserService,
  ) {}

  async create(invoiceData: CreateInvoiceDto): Promise<Invoice> {
    // Create the invoice record first
    const invoice = this.invoiceRepository.create(invoiceData)

    // Call Textract to process the invoice
    let textractOutput
    try {
      textractOutput = await this.textractService.analyzeInvoice(
        invoiceData.s3Bucket,
        invoiceData.documentKey,
      )
      console.log('Textract result:', textractOutput)
    } catch (error) {
      console.error('Error processing invoice via Textract:', error)
    }

    // Parse Textract output if available
    if (textractOutput) {
      const parsedData = this.textractParserService.parseExpense(textractOutput)
      invoice.vendor = parsedData.vendor || invoice.vendor
      invoice.totalAmount = parsedData.totalAmount || invoice.totalAmount
      invoice.invoiceDate = parsedData.invoiceDate || invoice.invoiceDate
      invoice.parsedData = parsedData
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      invoice.textractData = textractOutput
    }

    // Save updated invoice with parsed data
    return this.invoiceRepository.save(invoice)
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({ relations: ['lineItems'] })
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['lineItems'],
    })
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`)
    }
    return invoice
  }
}
