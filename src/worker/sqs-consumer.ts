/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs'
import {
  TextractClient,
  StartExpenseAnalysisCommand,
  GetExpenseAnalysisCommand,
} from '@aws-sdk/client-textract'
import { AppDataSource } from '../data-source'
import * as dotenv from 'dotenv'
import { Invoice } from '../invoices/entities/invoice.entity'
import { TextractParserService } from '../textract/services/textract-parser.service'
dotenv.config()

// Helper function for delay (for polling)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Setup AWS SQS client
const sqsClient = new SQSClient({ region: process.env.AWS_REGION })
const queueUrl: string = process.env.SQS_QUEUE_URL!
if (!queueUrl) {
  throw new Error('SQS_QUEUE_URL environment variable is not set')
}

// Setup AWS Textract client
const textractClient = new TextractClient({ region: process.env.AWS_REGION })

// Ensure DataSource is initialized
async function ensureDataSourceInitialized() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
    console.log('Data Source has been initialized in consumer!')
  }
}

async function processInvoiceJob(messageBody: any, attempt = 1): Promise<void> {
  const { invoiceId, s3Bucket, documentKey } = messageBody
  try {
    // Start expense analysis (using the StartExpenseAnalysisCommand)
    const startCommand = new StartExpenseAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: s3Bucket,
          Name: documentKey,
        },
      },
    })
    const startResponse = await textractClient.send(startCommand)
    const jobId = startResponse.JobId
    console.log(
      `Started Textract job for invoice ${invoiceId}, JobId: ${jobId}`,
    )

    // Poll for job completion
    let jobStatus = 'IN_PROGRESS'
    let textractOutput: any
    while (jobStatus === 'IN_PROGRESS') {
      await delay(5000)
      const getCommand = new GetExpenseAnalysisCommand({ JobId: jobId })
      textractOutput = await textractClient.send(getCommand)
      jobStatus = textractOutput.JobStatus || 'IN_PROGRESS'
      console.log(`Invoice ${invoiceId} JobStatus: ${jobStatus}`)
      if (jobStatus === 'FAILED') {
        throw new Error(`Textract job failed for invoice ${invoiceId}`)
      }
    }

    // Process Textract response
    const parserService = new TextractParserService()
    const parsedData = parserService.parseExpense(textractOutput)

    // Update the invoice record in the database
    const invoiceRepository = AppDataSource.getRepository(Invoice)
    const invoice = await invoiceRepository.findOneBy({ id: invoiceId })
    if (invoice) {
      invoice.vendor = parsedData.vendor || invoice.vendor
      invoice.totalAmount = parsedData.totalAmount || invoice.totalAmount
      invoice.invoiceDate = parsedData.invoiceDate || invoice.invoiceDate
      invoice.parsedData = parsedData
      invoice.textractData = textractOutput
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
    // Retry up to a maximum (e.g., 3 attempts)
    if (attempt < 3) {
      await delay(5000) // wait before retrying
      return processInvoiceJob(messageBody, attempt + 1)
    } else {
      // Optionally, log to a dead-letter queue here or update invoice record with failure status
      console.error(`Invoice ${invoiceId} failed after ${attempt} attempts.`)
      throw err
    }
  }
}

async function pollQueue() {
  // Ensure DataSource is initialized
  await ensureDataSourceInitialized()

  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20, // Long polling
  }

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params))
    if (data.Messages) {
      for (const message of data.Messages) {
        const messageBody = JSON.parse(message.Body || '{}')
        try {
          await processInvoiceJob(messageBody)
          // Delete message after successful processing
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
          // Optionally implement retry logic or move the message to a dead-letter queue
        }
      }
    } else {
      console.log('No messages in queue')
    }
  } catch (error) {
    console.error('Error receiving messages:', error)
  }

  // Continue polling
  setTimeout(pollQueue, 5000)
}

pollQueue().catch(console.error)
