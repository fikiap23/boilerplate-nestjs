import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';
import {
  IMerchantRepository,
  PaginatedResult,
} from '../../domain/repositories/merchant.repository.interface';
import { Merchant } from '../../domain/entities/merchant.entity';
import {
  CreateMerchantDto,
  FilterMerchantDto,
  UpdateMerchantDto,
} from '../../presentation/dto/merchant.dto';

@Injectable()
export class MerchantService {
  constructor(
    @Inject('IMerchantRepository')
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  async handleCreate(dto: CreateMerchantDto): Promise<Merchant> {
    const existing = await this.merchantRepository.getFirst({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new CustomError({
        statusCode: HttpStatus.CONFLICT,
        message: 'Merchant slug already exists',
      });
    }

    const merchant = new Merchant({
      name: dto.name,
      slug: dto.slug,
    });

    return await this.merchantRepository.create({
      data: merchant,
    });
  }

  async handleGetById(id: string): Promise<Merchant> {
    return await this.merchantRepository.getThrowById({
      id,
      setCache: true,
    });
  }

  async handleGetManyPaginate(
    dto: FilterMerchantDto,
  ): Promise<PaginatedResult<Merchant>> {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const filter = {
      search: dto.search,
    };

    return await this.merchantRepository.getManyPaginate({
      where: filter,
      orderBy: { field: 'createdAt', sort },
      page,
      limit,
      setCache: true,
    });
  }

  async handleUpdateById(
    id: string,
    dto: UpdateMerchantDto,
  ): Promise<Merchant> {
    const merchant = await this.merchantRepository.getThrowById({
      id,
    });

    if (dto.slug && dto.slug !== merchant.getSlug()) {
      const existing = await this.merchantRepository.getFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new CustomError({
          statusCode: HttpStatus.CONFLICT,
          message: 'Merchant slug already exists',
        });
      }
    }

    merchant.updateDetails(dto.name, dto.slug);

    return await this.merchantRepository.updateById({
      id,
      data: merchant,
    });
  }

  async handleDeleteById(id: string): Promise<Merchant> {
    await this.merchantRepository.getThrowById({ id });
    return await this.merchantRepository.deleteById({ id });
  }
}
