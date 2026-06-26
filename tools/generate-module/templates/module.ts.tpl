import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { {{pascal}}Controller } from './controllers/{{kebab}}.controller';
import { {{pascal}}Service } from './services/{{kebab}}.service';
import { {{pascal}}Repository } from './repositories/{{kebab}}.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [{{pascal}}Controller],
  providers: [{{pascal}}Service, {{pascal}}Repository],
  exports: [{{pascal}}Service, {{pascal}}Repository],
})
export class {{pascal}}Module {}
