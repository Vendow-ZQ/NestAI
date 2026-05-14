import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: !!process.env.S3_ENDPOINT,
    });
    this.bucket = process.env.S3_BUCKET!;
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    const ext = extname(file.originalname);
    const key = `uploads/${randomUUID()}${ext}`;

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    const url = process.env.S3_ENDPOINT
      ? `${process.env.S3_ENDPOINT}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return { url, key };
  }
}
