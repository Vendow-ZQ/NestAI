import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SpacesService } from '@/modules/spaces/spaces.service';
import { callLLM } from '@/lib/llm';

// 内存存储，Day 3 测试用。后续切数据库时恢复 db 操作
export interface MemorySession {
  id: string;
  spaceId: string | null;
  shortTermMemory: string | null;
  questions: Array<{ q: string; options: string[] }> | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const memorySessions: MemorySession[] = [];

@Injectable()
export class SessionsService {
  constructor(private readonly spacesService: SpacesService) {}

  async create(spaceId: string) {
    const session: MemorySession = {
      id: randomUUID(),
      spaceId,
      shortTermMemory: null,
      questions: null,
      status: 'uploaded',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memorySessions.push(session);
    return session;
  }

  async findOne(id: string) {
    const session = memorySessions.find((s) => s.id === id);
    if (!session) throw new NotFoundException('找不到这个 session');
    return session;
  }

  async analyze(sessionId: string) {
    const session = await this.findOne(sessionId);

    if (!session.spaceId) {
      throw new NotFoundException('这个 session 还没有绑定空间');
    }

    // 获取空间图片
    const space = await this.spacesService.findOne(session.spaceId);

    const imageUrl = space?.images?.[0]?.s3Url;
    if (!imageUrl) {
      throw new NotFoundException('这个空间还没有上传图片');
    }

    // 调用 Prompt001
    const result = await callLLM({
      promptId: 'p001_space_reader',
      variables: { imageUrl },
      images: [imageUrl],
    });

    // 解析 JSON 输出
    let description = '';
    let questions: Array<{ q: string; options: string[] }> = [];

    try {
      const parsed = (result.parsed || JSON.parse(result.raw)) as {
        description: string;
        questions: Array<{ q: string; options: string[] }>;
      };
      description = parsed.description || '';
      questions = parsed.questions || [];
    } catch {
      // JSON 解析失败时，把整个输出当描述
      description = result.raw;
    }

    // 更新短期记忆
    session.shortTermMemory = description;
    session.questions = questions;
    session.status = 'chat_done';
    session.updatedAt = new Date();

    return { description, questions };
  }
}
