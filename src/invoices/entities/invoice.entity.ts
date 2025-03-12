import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm'

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
}
