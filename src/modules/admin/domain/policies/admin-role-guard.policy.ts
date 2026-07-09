import { Injectable } from '@nestjs/common';

import { CustomError } from 'src/common/exceptions/custom-error';
import { EAdminRole } from 'src/common/enums/admin.enum';
import { AdminRepository } from '../../repositories/admin.repository';
import { getAdminSelect } from '../../types/select-admin.type';

@Injectable()
export class AdminRoleGuardPolicy {
  constructor(private readonly adminRepository: AdminRepository) {}

  async assertSuperAdmin(actorId: string): Promise<void> {
    const actor = await this.adminRepository.getThrowById({
      id: actorId,
      select: getAdminSelect('general'),
    });

    if (actor.role !== EAdminRole.SUPERADMIN) {
      throw new CustomError({ statusCode: 403, message: 'Forbidden' });
    }
  }
}
