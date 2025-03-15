import { DataSource } from 'typeorm'
import { Invoice } from './invoices/entities/invoice.entity'
import { InvoiceLineItem } from './invoices/entities/invoice-line-item.entity'

const dbPort = process.env.DB_PORT || ''
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(dbPort, 10) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true, // Use with caution in production
  entities: [Invoice, InvoiceLineItem],
})
