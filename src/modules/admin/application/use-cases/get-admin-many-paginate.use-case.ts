import { Inject, Injectable } from '@nestjs/common';
import {
  IAdminRepository,
  PaginatedResult,
} from '../../domain/repositories/admin.repository.interface';
import { Admin } from '../../domain/entities/admin.entity';
import { FilterAdminDto } from '../../presentation/dto/admin.dto';

@Injectable()
export class GetAdminManyPaginateUseCase {
  constructor(
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(dto: FilterAdminDto): Promise<PaginatedResult<Admin>> {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const filter = {
      search: dto.search,
      role: dto.role,
      status: dto.status,
    };

    return await this.adminRepository.getManyPaginate({
      where: filter,
      orderBy: { field: 'createdAt', sort },
      page,
      limit,
      setCache: true,
    });
  }
}
