import { Controller, Post, Get, Param, Body, NotFoundException } from '@nestjs/common';
import { SpacesService } from './spaces.service';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  async create(
    @Body() body: { userId: string; images: Array<{ s3Url: string; uploadedAt: string }> },
  ) {
    const space = await this.spacesService.create(body.userId, body.images);
    return { success: true, data: { id: space.id } };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const space = await this.spacesService.findOne(id);
      return { success: true, data: space };
    } catch (e) {
      if (e instanceof NotFoundException) {
        return { success: false, message: e.message };
      }
      throw e;
    }
  }
}
