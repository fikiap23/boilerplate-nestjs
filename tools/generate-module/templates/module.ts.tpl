import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { {{pascal}}Controller } from './presentation/controllers/{{kebab}}.controller';
import { {{pascal}}Service } from './application/services/{{kebab}}.service';
import { {{pascal}}Repository } from './repositories/{{kebab}}.repository';
import { Prisma{{pascal}}Repository } from './infrastructure/repositories/prisma-{{kebab}}.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [{{pascal}}Controller],
  providers: [
    {{pascal}}Service,
    {{pascal}}Repository,
    {
      provide: 'I{{pascal}}Repository',
      useClass: Prisma{{pascal}}Repository,
    },
  ],
  exports: [{{pascal}}Service, {{pascal}}Repository],
})
export class {{pascal}}Module {}
