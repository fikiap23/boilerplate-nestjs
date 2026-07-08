import { Injectable } from '@nestjs/common';
import { ProductClient } from '../../client/product.client';
import { ProductClientResponse } from '../../client/product.response';
import { ProductService } from './product.service';

@Injectable()
export class ProductClientImpl implements ProductClient {
  constructor(private readonly productService: ProductService) {}

  async getProduct(id: string): Promise<ProductClientResponse | null> {
    try {
      const product = await this.productService.handleGetById(id);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: product.stock,
        description: product.description,
      };
    } catch {
      return null;
    }
  }

  async reduceStock(id: string, quantity: number): Promise<void> {
    await this.productService.handleReduceStock(id, quantity);
  }

  async restoreStock(id: string, quantity: number): Promise<void> {
    await this.productService.handleRestoreStock(id, quantity);
  }
}
