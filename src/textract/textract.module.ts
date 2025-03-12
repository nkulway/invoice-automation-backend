import { Module } from '@nestjs/common'
import { TextractService } from './services/textract.service'

@Module({
  providers: [TextractService],
  exports: [TextractService], // Export it so other modules can use it
})
export class TextractModule {}
