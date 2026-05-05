import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { ContactController } from './controllers/contact.controller';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [EmailModule, SecurityModule],
  controllers: [ContactController],
})
export class ContactModule {}
