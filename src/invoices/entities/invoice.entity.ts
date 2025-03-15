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

  // Ensure this relation is correctly defined.
  @OneToMany(() => InvoiceLineItem, (lineItem) => lineItem.invoice, {
    cascade: true,
  })
  lineItems: InvoiceLineItem[]

  // Optional: additional fields for raw/parsed data
  @Column({ type: 'json', nullable: true })
  parsedData?: any

  @Column({ type: 'json', nullable: true })
  textractData?: any
}
