import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs'
import {
  TextractClient,
  StartExpenseAnalysisCommand,
  StartExpenseAnalysisCommandOutput,
  GetExpenseAnalysisCommand,
  GetExpenseAnalysisCommandOutput,
} from '@aws-sdk/client-textract'
import { AppDataSource } from '../data-source'
import * as dotenv from 'dotenv'
import { Invoice } from '../invoices/entities/invoice.entity'
import { TextractParserService } from '../textract/services/textract-parser.service'
dotenv.config()

// Define an interface for the SQS job message
interface InvoiceJob {
  invoiceId: number
  s3Bucket: string
  documentKey: string
}

// Helper function for delay (for polling)
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Setup AWS SQS client
const sqsClient = new SQSClient({ region: process.env.AWS_REGION })
const queueUrl: string = process.env.SQS_QUEUE_URL!
if (!queueUrl) {
  throw new Error('SQS_QUEUE_URL environment variable is not set')
}

// Setup AWS Textract client
const textractClient = new TextractClient({ region: process.env.AWS_REGION })

// Ensure DataSource is initialized
async function ensureDataSourceInitialized(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
    console.log('Data Source has been initialized in consumer!')
  }
}

async function processInvoiceJob(
  messageBody: InvoiceJob,
  attempt = 1,
): Promise<void> {
  const { invoiceId, s3Bucket, documentKey } = messageBody
  try {
    // Start asynchronous Textract expense analysis
    const startCommand = new StartExpenseAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: s3Bucket,
          Name: documentKey,
        },
      },
    })
    const startResponse: StartExpenseAnalysisCommandOutput =
      await textractClient.send(startCommand)
    const jobId = startResponse.JobId
    console.log(
      `Started Textract job for invoice ${invoiceId}, JobId: ${jobId}`,
    )

    // Poll for job completion
    let jobStatus = 'IN_PROGRESS'
    let textractOutput: GetExpenseAnalysisCommandOutput | undefined
    while (jobStatus === 'IN_PROGRESS') {
      await delay(5000)
      const getCommand = new GetExpenseAnalysisCommand({ JobId: jobId! })
      textractOutput = await textractClient.send(getCommand)
      jobStatus = textractOutput.JobStatus || 'IN_PROGRESS'
      console.log(`Invoice ${invoiceId} JobStatus: ${jobStatus}`)
      if (jobStatus === 'FAILED') {
        throw new Error(`Textract job failed for invoice ${invoiceId}`)
      }
    }

    // Process the Textract response through the parser
    const parserService = new TextractParserService()
    const parsedData = parserService.parseExpense(textractOutput!)

    // Update the invoice record in the database using AppDataSource
    const invoiceRepository = AppDataSource.getRepository(Invoice)
    const invoice = await invoiceRepository.findOneBy({ id: invoiceId })
    if (invoice) {
      invoice.vendor = parsedData.vendor || invoice.vendor
      invoice.totalAmount = parsedData.totalAmount || invoice.totalAmount
      invoice.invoiceDate = parsedData.invoiceDate || invoice.invoiceDate
      invoice.parsedData = parsedData
      invoice.textractData = textractOutput
      invoice.processingStatus = 'COMPLETED'
      await invoiceRepository.save(invoice)
      console.log(`Invoice ${invoiceId} updated with parsed Textract data`)
    } else {
      console.error(`Invoice ${invoiceId} not found`)
    }
  } catch (err) {
    console.error(
      `Error processing invoice ${invoiceId} on attempt ${attempt}:`,
      err,
    )
    const backoffDelay = 5000 * Math.pow(2, attempt - 1)
    if (attempt < 3) {
      console.log(`Retrying invoice ${invoiceId} after ${backoffDelay}ms...`)
      await delay(backoffDelay)
      return processInvoiceJob(messageBody, attempt + 1)
    } else {
      console.error(`Invoice ${invoiceId} failed after ${attempt} attempts.`)
      const invoiceRepository = AppDataSource.getRepository(Invoice)
      const invoice = await invoiceRepository.findOneBy({ id: invoiceId })
      if (invoice) {
        invoice.processingStatus = 'FAILED'
        await invoiceRepository.save(invoice)
      }
      throw err
    }
  }
}

async function pollQueue(): Promise<void> {
  // Ensure DataSource is initialized
  await ensureDataSourceInitialized()

  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20, // Long polling
  }

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params))
    if (data.Messages && data.Messages.length > 0) {
      for (const message of data.Messages) {
        // Safely parse the message body into an InvoiceJob.
        let messageBody: InvoiceJob
        try {
          messageBody = JSON.parse(message.Body || '{}') as InvoiceJob
        } catch (parseError) {
          console.error('Error parsing message body:', parseError)
          continue
        }
        try {
          await processInvoiceJob(messageBody)
          if (message.ReceiptHandle) {
            await sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              }),
            )
            console.log('Message deleted from SQS')
          }
        } catch (err) {
          console.error('Error processing job:', err)
          // Optionally, implement further retry logic or move the message to a DLQ.
        }
      }
    } else {
      console.log('No messages in queue')
    }
  } catch (error) {
    console.error('Error receiving messages:', error)
  }

  // Continue polling (wrap in arrow function to ensure void return)
  setTimeout(() => {
    pollQueue()
  }, 5000)
}

pollQueue().catch(console.error)
