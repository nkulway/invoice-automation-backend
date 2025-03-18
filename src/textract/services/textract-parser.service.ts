import { Injectable } from '@nestjs/common'
import {
  TextractExpenseAnalysisResponse,
  TextractExpenseDocument,
  TextractExpenseField,
  TextractLineItemGroup,
} from '../textract.types'
import {
  ParsedExpense,
  LineItem,
  BillToAddress,
} from './textract-parser.interfaces'

/**
 * Aggregates an asynchronous Textract response
 */
function aggregateExpenseDocument(blocks: unknown[]): TextractExpenseDocument {
  const expenseDocument: TextractExpenseDocument = {
    SummaryFields: [],
    LineItemGroups: [],
  }

  blocks.forEach((block) => {
    if (typeof block === 'object' && block !== null) {
      const blk = block as Record<string, unknown>
      if (blk.BlockType === 'KEY_VALUE_SET') {
        expenseDocument.SummaryFields?.push(
          blk as unknown as TextractExpenseField,
        )
      }
      // add logic here to group blocks into line items
    }
  })

  return expenseDocument
}

/**
 * Parses an array of summary fields to extract vendor, total amount, invoice date, and bill-to information
 */
function parseSummaryFields(summaryFields: TextractExpenseField[]): {
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
    const groupTypes: string[] = field.GroupProperties?.[0]?.Types || []

    if (groupTypes.includes('RECEIVER_BILL_TO')) {
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

/**
 * Parses line item groups to extract an array of line items.
 */
function parseLineItems(lineItemGroups: TextractLineItemGroup[]): LineItem[] {
  const lineItems: LineItem[] = []

  lineItemGroups.forEach((group) => {
    if (!group.LineItems) return
    group.LineItems.forEach((item) => {
      let description = ''
      let quantity = 0
      let unit = ''
      let price = 0

      if (item.LineItemExpenseFields) {
        item.LineItemExpenseFields.forEach((field) => {
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
  parseExpense(textractOutput: unknown): ParsedExpense {
    // Narrow the textractOutput type.
    const output = textractOutput as TextractExpenseAnalysisResponse

    // Try to get an expense document from ExpenseDocuments.
    let expenseDocument: TextractExpenseDocument | undefined = undefined
    if (Array.isArray(output.ExpenseDocuments)) {
      expenseDocument = output.ExpenseDocuments[0]
    }
    // If ExpenseDocuments is not present, try aggregating from Blocks.
    if (!expenseDocument && Array.isArray(output.Blocks)) {
      expenseDocument = aggregateExpenseDocument(output.Blocks)
    }
    if (!expenseDocument) {
      return {
        vendor: '',
        totalAmount: 0,
        invoiceDate: new Date(),
        lineItems: [],
        billTo: {},
      }
    }

    const summaryFields = Array.isArray(expenseDocument.SummaryFields)
      ? expenseDocument.SummaryFields
      : []
    const { vendor, totalAmount, invoiceDate, billTo } =
      parseSummaryFields(summaryFields)
    const lineItemGroups = Array.isArray(expenseDocument.LineItemGroups)
      ? expenseDocument.LineItemGroups
      : []
    const lineItems = parseLineItems(lineItemGroups)

    return { vendor, totalAmount, invoiceDate, lineItems, billTo }
  }
}

export { ParsedExpense }
