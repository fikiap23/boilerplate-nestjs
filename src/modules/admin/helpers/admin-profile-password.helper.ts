import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { compareBcrypt, hashBcrypt } from 'src/common/utils/bcrypt.util';
import { UpdateProfileAdminDto } from '../presentation/dto/admin.dto';

@Injectable()
export class AdminProfilePasswordHelper {
  async resolvePasswordHash(
    dto: UpdateProfileAdminDto,
    currentPasswordHash: string,
  ): Promise<string | undefined> {
    if (dto.oldPassword && dto.newPassword) {
      const isMatch = await compareBcrypt(dto.oldPassword, currentPasswordHash);

      if (!isMatch) {
        throw new CustomError({
          statusCode: 400,
          message: 'Current password is incorrect',
        });
      }

      return hashBcrypt(dto.newPassword);
    }

    if (dto.oldPassword && !dto.newPassword) {
      throw new CustomError({
        statusCode: 400,
        message: 'newPassword is required when changing password',
      });
    }

    return undefined;
  }
}
