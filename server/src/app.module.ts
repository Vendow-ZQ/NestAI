import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UploadModule } from '@/modules/upload/upload.module';
import { SpacesModule } from '@/modules/spaces/spaces.module';
import { SessionsModule } from '@/modules/sessions/sessions.module';

@Module({
  imports: [UploadModule, SpacesModule, SessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
