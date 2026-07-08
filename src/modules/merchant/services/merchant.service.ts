import { HttpStatus, Injectable } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';

import { MerchantRepository } from '../repositories/merchant.repository';
import { getMerchantSelect } from '../types/select-merchant.type';
import {
  CreateMerchantDto,
  FilterMerchantDto,
  UpdateMerchantDto,
} from '../dto/merchant.dto';
import { whereMerchantGetManyPaginate } from '../types/where-merchant.type';

@Injectable()
export class MerchantService {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async handleCreate(dto: CreateMerchantDto) {
    const existing = await this.merchantRepository.getFirst({
      where: { slug: dto.slug },
      select: getMerchantSelect('minimal'),
    });

    if (existing) {
      throw new CustomError({
        statusCode: HttpStatus.CONFLICT,
        message: 'Merchant slug already exists',
      });
    }

    return await this.merchantRepository.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
      select: getMerchantSelect('general'),
    });
  }

  async handleGetById(id: string) {
    return await this.merchantRepository.getThrowById({
      id,
      select: getMerchantSelect('general'),
      setCache: true,
    });
  }

  async handleGetManyPaginate(dto: FilterMerchantDto) {
    const { sort = 'desc', page = 1, limit = 10 } = dto;
    const { where } = whereMerchantGetManyPaginate(dto);

    return await this.merchantRepository.getManyPaginate({
      where,
      select: getMerchantSelect('general'),
      orderBy: { createdAt: sort },
      page,
      limit,
      setCache: true,
    });
  }

  async handleUpdateById(id: string, dto: UpdateMerchantDto) {
    const current = await this.merchantRepository.getThrowById({
      id,
      select: getMerchantSelect('minimal'),
    });

    if (dto.slug) {
      const existing = await this.merchantRepository.getFirst({
        where: { slug: dto.slug, id: { not: current.id } },
        select: getMerchantSelect('minimal'),
      });
      if (existing) {
        throw new CustomError({
          statusCode: HttpStatus.CONFLICT,
          message: 'Merchant slug already exists',
        });
      }
    }

    return await this.merchantRepository.updateById({
      id: current.id,
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
      },
      select: getMerchantSelect('general'),
    });
  }

  async handleDeleteById(id: string) {
    const current = await this.merchantRepository.getThrowById({
      id,
      select: getMerchantSelect('minimal'),
    });

    return await this.merchantRepository.deleteById({
      id: current.id,
      select: getMerchantSelect('general'),
    });
  }
}
