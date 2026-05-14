import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

// 内存存储，Day 3 测试用。后续切数据库时恢复 db 操作
export interface MemorySpace {
  id: string;
  userId: string | null;
  type: string | null;
  layout: string | null;
  images: Array<{ s3Url: string; uploadedAt: string; position?: string }> | null;
  longTermMemory: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const memorySpaces: MemorySpace[] = [];

@Injectable()
export class SpacesService {
  async create(userId: string, images: Array<{ s3Url: string; uploadedAt: string }>) {
    const space: MemorySpace = {
      id: randomUUID(),
      userId: null,
      type: null,
      layout: null,
      images,
      longTermMemory: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memorySpaces.push(space);
    return space;
  }

  async findOne(id: string) {
    const space = memorySpaces.find((s) => s.id === id);
    if (!space) throw new NotFoundException('找不到这个空间');
    return space;
  }
}
