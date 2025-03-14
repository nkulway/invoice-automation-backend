import { Module } from '@nestjs/common'
import { TextractService } from './services/textract.service'
import { TextractParserService } from './services/textract-parser.service'

@Module({
  providers: [TextractService, TextractParserService],
  exports: [TextractService, TextractParserService],
})
export class TextractModule {}
