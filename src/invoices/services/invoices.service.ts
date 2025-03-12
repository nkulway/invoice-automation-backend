import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from '../entities/invoice.entity'

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(invoiceData)
    return this.invoiceRepository.save(invoice)
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find()
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOneBy({ id })
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`)
    }
    return invoice
  }
}
