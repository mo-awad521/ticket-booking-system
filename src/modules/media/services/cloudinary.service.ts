import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { CloudinaryDestroyResponse } from '../interfaces/clouldinary.interface';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'Booking System',
  ): Promise<{ url: string; publicId: string }> {
    try {
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                const message =
                  typeof error === 'object' &&
                  error !== null &&
                  'message' in error
                    ? (error as { message: string }).message
                    : 'Cloudinary upload failed';
                return reject(new Error(message));
              }

              if (!result) return reject(new Error('No upload result'));
              resolve(result);
            },
          )
          .end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      throw new BadRequestException('Cloudinary upload failed');
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder = 'Booking System',
  ): Promise<{ url: string; publicId: string }[]> {
    const results: { url: string; publicId: string }[] = [];

    for (const file of files) {
      const uploaded = await this.uploadImage(file, folder);
      results.push(uploaded);
    }

    return results;
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const res = (await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      })) as CloudinaryDestroyResponse;
      // console.log(publicId);

      // console.log(res);

      return res.result === 'ok';
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      throw new BadRequestException('Failed to delete image');
    }
  }
}
