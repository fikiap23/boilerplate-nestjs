import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { {{pascal}}Controller } from './presentation/controllers/{{kebab}}.controller';
import { Get{{pascal}}ByIdUseCase } from './application/use-cases/get-{{kebab}}-by-id.use-case';
import { {{pascal}}Repository } from './repositories/{{kebab}}.repository';
import { Prisma{{pascal}}Repository } from './infrastructure/repositories/prisma-{{kebab}}.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [{{pascal}}Controller],
  providers: [
    Get{{pascal}}ByIdUseCase,
    {{pascal}}Repository,
    {
      provide: 'I{{pascal}}Repository',
      useClass: Prisma{{pascal}}Repository,
    },
  ],
  exports: [Get{{pascal}}ByIdUseCase, {{pascal}}Repository],
})
export class {{pascal}}Module {}
