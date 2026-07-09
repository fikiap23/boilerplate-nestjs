import { Injectable } from '@nestjs/common';
import { ProductClient } from '../../client/product.client';
import { ProductClientResponse } from '../../client/product.response';
import { GetProductByIdUseCase } from '../use-cases/get-product-by-id.use-case';
import { ReduceProductStockUseCase } from '../use-cases/reduce-product-stock.use-case';
import { RestoreProductStockUseCase } from '../use-cases/restore-product-stock.use-case';

@Injectable()
export class ProductClientImpl implements ProductClient {
  constructor(
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly reduceProductStockUseCase: ReduceProductStockUseCase,
    private readonly restoreProductStockUseCase: RestoreProductStockUseCase,
  ) {}

  async getProductById(id: string): Promise<ProductClientResponse | null> {
    try {
      const product = await this.getProductByIdUseCase.execute(id);
      if (!product) return null;
      return {
        id: product.getId(),
        name: product.getName(),
        price: product.getPrice().getValue(),
        stock: product.getStock().getValue(),
        description: product.getDescription(),
      };
    } catch {
      return null;
    }
  }

  async reduceStock(id: string, quantity: number): Promise<void> {
    await this.reduceProductStockUseCase.execute(id, quantity);
  }

  async restoreStock(id: string, quantity: number): Promise<void> {
    await this.restoreProductStockUseCase.execute(id, quantity);
  }
}
