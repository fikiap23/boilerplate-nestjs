import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IPayloadJWT } from 'src/shared/interfaces/auth.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IPayloadJWT => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
