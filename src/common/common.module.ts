import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtHelper } from './utils/jwt.helper';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [JwtHelper],
  exports: [JwtHelper, JwtModule],
})
export class CommonModule {}
