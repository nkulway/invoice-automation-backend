/** response from AWS Textract's Expense Analysis APIs */
export interface TextractExpenseAnalysisResponse {
  JobStatus: string
  JobId: string
  NextToken?: string
  AnalyzeExpenseModelVersion?: string
  ExpenseDocuments?: TextractExpenseDocument[]
  $metadata: Record<string, unknown>
  Blocks?: unknown[]
}

/** single expense document extracted from an invoice */
export interface TextractExpenseDocument {
  SummaryFields?: TextractExpenseField[]
  LineItemGroups?: TextractLineItemGroup[]
}

/** Represents a key-value field in the expense document */
export interface TextractExpenseField {
  Type: {
    Text: string
  }
  ValueDetection: {
    Text: string
  }
  GroupProperties?: TextractGroupProperty[]
}

/** grouping metadata for a field - e.g. identifying a “RECEIVER_BILL_TO” group */
export interface TextractGroupProperty {
  Id: string
  Types: string[]
}

/** group of line items in the expense document */
export interface TextractLineItemGroup {
  LineItems?: TextractLineItem[]
}

/** single line item in the expense document */
export interface TextractLineItem {
  LineItemExpenseFields?: TextractExpenseField[]
}
