import { Global, Module } from '@nestjs/common';
import { AutoComposeHelper } from './auto-compose.helper';
import { PrismaService } from './prisma.service';
import { RepositoryRegistry } from './repository-registry';

@Global()
@Module({
  providers: [PrismaService, RepositoryRegistry, AutoComposeHelper],
  exports: [PrismaService, RepositoryRegistry, AutoComposeHelper],
})
export class PrismaModule {}
