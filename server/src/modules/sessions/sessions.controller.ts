import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Body() body: { spaceId: string }) {
    const session = await this.sessionsService.create(body.spaceId);
    return {
      success: true,
      data: { id: session.id, status: session.status },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const session = await this.sessionsService.findOne(id);
      return { success: true, data: session };
    } catch (e) {
      if (e instanceof NotFoundException) {
        return { success: false, message: e.message };
      }
      throw e;
    }
  }

  @Post(':id/analyze')
  async analyze(@Param('id') id: string) {
    const result = await this.sessionsService.analyze(id);
    return { success: true, data: result };
  }
}
