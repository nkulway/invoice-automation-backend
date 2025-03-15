/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common'
import {
  ParsedExpense,
  LineItem,
  BillToAddress,
} from './textract-parser.interfaces'

// Aggregates an asynchronous Textract response
function aggregateExpenseDocument(blocks: any[]): any {
  const expenseDocument: any = {
    SummaryFields: [] as any[],
    LineItemGroups: [] as any[],
  }

  // For simplicity, we assume that KEY_VALUE_SET blocks are summary fields
  blocks.forEach((block) => {
    if (block.BlockType === 'KEY_VALUE_SET') {
      expenseDocument.SummaryFields.push(block)
    }
    // Optionally, add logic to aggregate line items if your response contains them
  })

  return expenseDocument
}

function parseSummaryFields(summaryFields: any[]): {
  vendor: string
  totalAmount: number
  invoiceDate: Date
  billTo: BillToAddress
} {
  let vendor = ''
  let totalAmount = 0
  let invoiceDate = new Date()
  const billTo: BillToAddress = {}

  summaryFields.forEach((field) => {
    const typeText = (field.Type?.Text || '').toLowerCase()
    const valueText = field.ValueDetection?.Text || ''
    // Check if this field is part of a RECEIVER_BILL_TO group.
    const groupTypes: string[] = field.GroupProperties?.[0]?.Types || []

    if (groupTypes.includes('RECEIVER_BILL_TO')) {
      // Map common field types to bill-to address field
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
      // Process invoice header fields.
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
        const d = new Date(valueText)
        if (!isNaN(d.getTime())) {
          invoiceDate = d
        }
      }
    }
  })

  return { vendor, totalAmount, invoiceDate, billTo }
}

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
          const fieldType = (field.Type?.Text || '').toLowerCase()
          const fieldValue = field.ValueDetection?.Text || ''
          if (fieldType.includes('item') || fieldType.includes('product')) {
            description = fieldValue
          }
          if (fieldType.includes('quantity')) {
            const q = parseInt(fieldValue, 10)
            if (!isNaN(q)) {
              quantity = q
            }
          }
          if (fieldType.includes('unit')) {
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
    let expenseDocument = textractOutput.ExpenseDocuments?.[0]
    // If ExpenseDocuments is not present, try to aggregate from Blocks.
    if (!expenseDocument && textractOutput.Blocks) {
      expenseDocument = aggregateExpenseDocument(textractOutput.Blocks)
    }
    if (!expenseDocument) {
      // Return defaults if no expense document could be derived.
      return {
        vendor: '',
        totalAmount: 0,
        invoiceDate: new Date(),
        lineItems: [],
        billTo: {},
      }
    }

    const summaryFields = expenseDocument.SummaryFields || []
    const { vendor, totalAmount, invoiceDate, billTo } =
      parseSummaryFields(summaryFields)
    const lineItemGroups = expenseDocument.LineItemGroups || []
    const lineItems = parseLineItems(lineItemGroups)

    return { vendor, totalAmount, invoiceDate, lineItems, billTo }
  }
}
export { ParsedExpense }
