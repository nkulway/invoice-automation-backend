export interface LineItem {
  description: string
  quantity: number
  unit: string
  price: number
}

export interface BillToAddress {
  name?: string
  addressBlock?: string
  street?: string
  city?: string
  state?: string
  zipCode?: string
}

export interface ParsedExpense {
  vendor: string
  totalAmount: number
  invoiceDate: Date
  lineItems: LineItem[]
  billTo?: BillToAddress
}
