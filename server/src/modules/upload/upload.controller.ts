import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('没有收到文件,请检查字段名是否为 "file"');
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('文件太大啦,请控制在 10MB 以内');
    }

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException('只支持 jpg、png、webp 格式的图片哦');
    }

    const result = await this.uploadService.uploadFile(file);

    return {
      success: true,
      data: {
        url: result.url,
        key: result.key,
      },
    };
  }
}
