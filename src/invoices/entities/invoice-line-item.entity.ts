/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm'
import { Invoice } from './invoice.entity'

@Entity()
export class InvoiceLineItem {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 200 })
  description: string

  @Column('int')
  quantity: number

  @Column('decimal')
  price: number

  @ManyToOne(() => Invoice, (invoice) => invoice.lineItems)
  invoice: Invoice
}
