import {
  TextractParserService,
  ParsedExpense,
} from './services/textract-parser.service'

describe('TextractParserService', () => {
  let parserService: TextractParserService

  beforeAll(() => {
    parserService = new TextractParserService()
  })

  it('should extract vendor, total amount, invoice date, line items and bill-to address correctly', () => {
    // Sample partial Textract JSON snippet
    const sampleResponse = {
      ExpenseDocuments: [
        {
          SummaryFields: [
            {
              Type: { Text: 'VENDOR' },
              ValueDetection: { Text: 'International Gourmet Foods, Inc.' },
            },
            {
              Type: { Text: 'TOTAL' },
              ValueDetection: { Text: '$1573.76' },
            },
            {
              Type: { Text: 'INVOICE_DATE' },
              ValueDetection: { Text: '2025-02-21' },
            },
            {
              GroupProperties: [{ Types: ['RECEIVER_BILL_TO'] }],
              Type: { Text: 'NAME' },
              ValueDetection: { Text: 'Bonafide Delicious' },
            },
            {
              GroupProperties: [{ Types: ['RECEIVER_BILL_TO'] }],
              Type: { Text: 'STREET' },
              ValueDetection: { Text: '1854 LA DRANCE STREET NE' },
            },
            {
              GroupProperties: [{ Types: ['RECEIVER_BILL_TO'] }],
              Type: { Text: 'CITY' },
              ValueDetection: { Text: 'Atlanta,' },
            },
            {
              GroupProperties: [{ Types: ['RECEIVER_BILL_TO'] }],
              Type: { Text: 'STATE' },
              ValueDetection: { Text: 'GA' },
            },
            {
              GroupProperties: [{ Types: ['RECEIVER_BILL_TO'] }],
              Type: { Text: 'ZIP_CODE' },
              ValueDetection: { Text: '30007' },
            },
          ],
          LineItemGroups: [
            {
              LineItems: [
                {
                  LineItemExpenseFields: [
                    {
                      Type: { Text: 'ITEM' },
                      ValueDetection: {
                        Text: 'SALT, KOSHER DIAMOND CRYSTAL 3-LB',
                      },
                    },
                    {
                      Type: { Text: 'QUANTITY' },
                      ValueDetection: { Text: '4' },
                    },
                    {
                      Type: { Text: 'UNIT' },
                      ValueDetection: { Text: '9.46 /BOX' },
                    },
                    {
                      Type: { Text: 'PRICE' },
                      ValueDetection: { Text: '37.84' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const result: ParsedExpense = parserService.parseExpense(sampleResponse)

    // Validate header information
    expect(result.vendor.toLowerCase()).toContain('international gourmet foods')
    expect(result.totalAmount).toBeCloseTo(1573.76)
    expect(result.invoiceDate.toISOString()).toBe(
      new Date('2025-02-21').toISOString(),
    )

    // Validate bill-to address
    expect(result.billTo?.name).toBe('Bonafide Delicious')
    expect(result.billTo?.street).toBe('1854 LA DRANCE STREET NE')
    expect(result.billTo?.city).toBe('Atlanta,')
    expect(result.billTo?.state).toBe('GA')
    expect(result.billTo?.zipCode).toBe('30007')

    // Validate line item extraction
    expect(result.lineItems.length).toBe(1)
    const lineItem = result.lineItems[0]
    expect(lineItem.description.toLowerCase()).toContain(
      'salt, kosher diamond crystal 3-lb',
    )
    expect(lineItem.quantity).toBe(4)
    expect(lineItem.unit).toBe('9.46 /BOX')
    expect(lineItem.price).toBeCloseTo(37.84)
  })

  it('should return default values when no expense document is found', () => {
    const sampleResponse = {}
    const result: ParsedExpense = parserService.parseExpense(sampleResponse)
    expect(result.vendor).toBe('')
    expect(result.totalAmount).toBe(0)
    expect(result.invoiceDate instanceof Date).toBe(true)
    expect(result.lineItems).toEqual([])
  })
})
