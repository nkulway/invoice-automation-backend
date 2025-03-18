import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator'

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  vendor!: string

  @IsNumber()
  totalAmount!: number

  @IsDateString()
  invoiceDate!: string

  @IsString()
  @IsNotEmpty()
  s3Bucket!: string

  @IsString()
  @IsNotEmpty()
  documentKey!: string
}
