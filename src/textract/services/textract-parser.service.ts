/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common'

// Define interfaces for line items and bill-to address.
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

// Helper function to parse summary fields and separate "bill to" info.
function parseSummaryFields(summaryFields: any[]): {
  vendor: string
  totalAmount: number
  invoiceDate: Date
  billTo: BillToAddress
} {
  let vendor = ''
  let totalAmount = 0
  let invoiceDate: Date = new Date()
  const billTo: BillToAddress = {}

  summaryFields.forEach((field) => {
    // We only care about Type?.Text and ValueDetection?.Text
    const typeText = field.Type?.Text?.toLowerCase() || ''
    const valueText = field.ValueDetection?.Text || ''
    const groupTypes: string[] = field.GroupProperties?.[0]?.Types || []

    if (groupTypes.includes('RECEIVER_BILL_TO')) {
      // Map common field types to bill-to properties.
      if (typeText.includes('address_block')) {
        billTo.addressBlock = valueText
      } else if (typeText.includes('street')) {
        billTo.street = valueText
      } else if (typeText.includes('city')) {
        billTo.city = valueText
      } else if (typeText.includes('state')) {
        billTo.state = valueText
      } else if (typeText.includes('zip')) {
        billTo.zipCode = valueText
      } else if (typeText.includes('name')) {
        billTo.name = valueText
      }
    } else {
      // Process fields that belong to the main invoice info.
      if (typeText.includes('vendor')) {
        vendor = valueText
      }
      if (typeText.includes('total')) {
        const parsed = parseFloat(valueText.replace(/[^0-9.]/g, ''))
        if (!isNaN(parsed)) {
          totalAmount = parsed
        }
      }
      if (typeText.includes('date')) {
        const date = new Date(valueText)
        if (!isNaN(date.getTime())) {
          invoiceDate = date
        }
      }
    }
  })

  return { vendor, totalAmount, invoiceDate, billTo }
}

// Helper function to parse line items from LineItemGroups.
function parseLineItems(lineItemGroups: any[]): LineItem[] {
  const lineItems: LineItem[] = []

  lineItemGroups.forEach((group) => {
    if (!group.LineItems) return

    group.LineItems.forEach((item: any) => {
      let description = ''
      let quantity = 0
      let unit = ''
      let price = 0

      if (item.LineItemExpenseFields) {
        item.LineItemExpenseFields.forEach((field: any) => {
          const fieldType = field.Type?.Text?.toLowerCase() || ''
          const fieldValue = field.ValueDetection?.Text || ''

          // Identify which fields map to which property:
          if (fieldType.includes('item') || fieldType.includes('product')) {
            description = fieldValue
          }
          if (
            fieldType.includes('quantity') ||
            fieldType.includes('qty available')
          ) {
            const q = parseInt(fieldValue, 10)
            if (!isNaN(q)) {
              quantity = q
            }
          }
          if (fieldType.includes('unit') || fieldType.includes('subtotal')) {
            unit = fieldValue
          }
          if (fieldType.includes('price')) {
            const p = parseFloat(fieldValue.replace(/[^0-9.]/g, ''))
            if (!isNaN(p)) {
              price = p
            }
          }
        })
      }
      if (description) {
        lineItems.push({ description, quantity, unit, price })
      }
    })
  })

  return lineItems
}

@Injectable()
export class TextractParserService {
  parseExpense(textractOutput: any): ParsedExpense {
    // Retrieve the first expense document.
    const expenseDocument = textractOutput.ExpenseDocuments?.[0]
    if (!expenseDocument) {
      return {
        vendor: '',
        totalAmount: 0,
        invoiceDate: new Date(),
        lineItems: [],
      }
    }

    const summaryFields = expenseDocument.SummaryFields || []
    const { vendor, totalAmount, invoiceDate, billTo } =
      parseSummaryFields(summaryFields)

    const lineItemGroups = expenseDocument.LineItemGroups || []
    const lineItems = parseLineItems(lineItemGroups)

    // We ignore geometry, polygons, bounding boxes, confidence, etc.
    // by never referencing them in the code.

    return { vendor, totalAmount, invoiceDate, lineItems, billTo }
  }
}
