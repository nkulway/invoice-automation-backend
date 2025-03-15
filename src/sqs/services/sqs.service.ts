import * as dotenv from 'dotenv'
import { Injectable } from '@nestjs/common'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
dotenv.config()
console.log('Current Working Directory:', process.cwd())
console.log('SQS_QUEUE_URL:', process.env.SQS_QUEUE_URL)

@Injectable()
export class SqsService {
  private client: SQSClient
  private queueUrl: string
  constructor() {
    this.client = new SQSClient({ region: process.env.AWS_REGION })
    this.queueUrl = process.env.SQS_QUEUE_URL || ''
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL environment variable is not set')
    }
  }

  async sendInvoiceJob(messageBody: any): Promise<void> {
    const params = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
    }
    const command = new SendMessageCommand(params)
    await this.client.send(command)
    console.log('Invoice job enqueued successfully')
  }
}
