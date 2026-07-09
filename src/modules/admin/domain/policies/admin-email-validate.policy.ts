import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { AdminRepository } from '../../repositories/admin.repository';
import { getAdminSelect } from '../../types/select-admin.type';

@Injectable()
export class AdminEmailValidatePolicy {
  constructor(private readonly adminRepository: AdminRepository) {}

  async assertEmailAvailable(email: string, excludeId?: string): Promise<void> {
    const byEmail = await this.adminRepository.getFirst({
      where: {
        email,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: getAdminSelect('minimal'),
    });

    if (byEmail) {
      throw new CustomError({
        statusCode: 409,
        message: 'Email already exists',
      });
    }
  }
}
