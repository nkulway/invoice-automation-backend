import { Injectable } from '@nestjs/common'
import {
  TextractClient,
  AnalyzeExpenseCommand,
  AnalyzeExpenseCommandOutput,
} from '@aws-sdk/client-textract'

@Injectable()
export class TextractService {
  private client: TextractClient

  constructor() {
    this.client = new TextractClient({ region: 'us-east-1' }) // should probably be an external config
  }

  async analyzeInvoice(
    s3Bucket: string,
    documentKey: string,
  ): Promise<AnalyzeExpenseCommandOutput> {
    const params = {
      Document: {
        S3Object: {
          Bucket: s3Bucket,
          Name: documentKey,
        },
      },
    }
    const command = new AnalyzeExpenseCommand(params)
    const result: AnalyzeExpenseCommandOutput = await this.client.send(command)
    return result
  }
}
