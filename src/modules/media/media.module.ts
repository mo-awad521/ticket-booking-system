import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { CloudinaryService } from './services/cloudinary.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, CloudinaryService],
  exports: [CloudinaryService],
})
export class MediaModule {}
