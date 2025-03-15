import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from '../entities/invoice.entity'
import { CreateInvoiceDto } from '../dto/create-invoice.dto'
import { TextractParserService } from '../../textract/services/textract-parser.service'
import { TextractService } from '../../textract/services/textract.service'
import { SqsService } from 'src/sqs/services/sqs.service'

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private readonly textractService: TextractService,
    private readonly textractParserService: TextractParserService,
    private readonly sqsService: SqsService,
  ) {}

  async create(invoiceData: CreateInvoiceDto): Promise<Invoice> {
    // Create the invoice record first
    const invoice = this.invoiceRepository.create(invoiceData)
    const savedInvoice = await this.invoiceRepository.save(invoice)

    // Enqueue a job for asynchronous processing of the invoice via AWS SQS.
    // The background worker will later pick up this job and perform the Textract call and parsing.
    await this.sqsService.sendInvoiceJob({
      invoiceId: savedInvoice.id,
      s3Bucket: invoiceData.s3Bucket,
      documentKey: invoiceData.documentKey,
    })

    // Return the created invoice record immediately.
    return savedInvoice
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
