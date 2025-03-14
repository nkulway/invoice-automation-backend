import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm'
import { InvoiceLineItem } from './invoice-line-item.entity'

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 100 })
  vendor: string

  @Column('decimal')
  totalAmount: number

  @Column({ type: 'date' })
  invoiceDate: Date

  @CreateDateColumn()
  createdAt: Date

  // Optional: store full Textract response for debugging or further processing
  @Column({ type: 'json', nullable: true })
  textractData?: any

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @OneToMany(() => InvoiceLineItem, (lineItem) => lineItem.invoice, {
    cascade: true,
  })
  lineItems: InvoiceLineItem[]
}
