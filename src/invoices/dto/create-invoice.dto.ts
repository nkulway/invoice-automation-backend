// import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator'

export class CreateInvoiceDto {
  vendor: string
  totalAmount: number
  invoiceDate: Date
  s3Bucket: string
  documentKey: string
}
