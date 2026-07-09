import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { CacheTags } from 'src/common/utils/cache-tag.util';

@Injectable()
export class ReduceProductStockUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(id: string, quantity: number): Promise<void> {
    let merchantId: string;

    await this.prisma.execTx(
      async (tx) => {
        const product = await this.productRepository.getThrowById({
          tx,
          id,
          lock: { mode: 'noKeyUpdate' },
        });

        product.reduceStock(quantity);
        merchantId = product.getMerchantId();

        await this.productRepository.updateById({
          tx,
          id,
          data: product,
          invalidate: 'none',
        });
      },
      async () => {
        await this.productRepository.invalidateCache({ id });
        await this.productRepository.invalidateCache({
          tags: CacheTags.merchant(merchantId),
        });
      },
    );
  }
}
