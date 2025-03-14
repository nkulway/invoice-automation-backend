import {
  TextractClient,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  GetDocumentAnalysisCommandOutput,
} from '@aws-sdk/client-textract'

// A helper function to delay execution (for polling)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function processMultiPageInvoice(
  bucket: string,
  documentKey: string,
): Promise<GetDocumentAnalysisCommandOutput> {
  // Create the Textract client using your region (ensure AWS credentials are configured)
  const client = new TextractClient({ region: 'us-east-1' })

  // Start the document analysis job for multi-page invoices
  const startCommand = new StartDocumentAnalysisCommand({
    DocumentLocation: {
      S3Object: {
        Bucket: bucket,
        Name: documentKey,
      },
    },
    FeatureTypes: ['TABLES', 'FORMS'], // Adjust features as needed
  })

  const startResponse = await client.send(startCommand)
  const jobId = startResponse.JobId
  console.log('Job started, JobId:', jobId)

  // Poll until the job completes
  let jobStatus = 'IN_PROGRESS'
  let analysisResult: GetDocumentAnalysisCommandOutput | undefined

  while (jobStatus === 'IN_PROGRESS') {
    // Wait for 5 seconds between polls
    await delay(5000)
    const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId })
    analysisResult = await client.send(getCommand)
    jobStatus = analysisResult.JobStatus || 'IN_PROGRESS'
    console.log('Current JobStatus:', jobStatus)
    if (jobStatus === 'FAILED') {
      throw new Error('Document analysis failed')
    }
  }

  if (jobStatus === 'SUCCEEDED' && analysisResult) {
    console.log('Job succeeded')
    return analysisResult
  } else {
    throw new Error('Document analysis did not complete successfully')
  }
}

// Example usage of the prototype function
processMultiPageInvoice(
  'my-invoice-bucket-2025',
  'multi-page-invoice-test-001.pdf',
)
  .then((response) => {
    console.log('Full Textract response:', JSON.stringify(response, null, 2))
    // You can add further parsing of the aggregated multi-page data here.
  })
  .catch((err) => {
    console.error('Error during Textract processing:', err)
  })
