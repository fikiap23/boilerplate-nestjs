import { ProductClientResponse } from './product.response';

export abstract class ProductClient {
  abstract getProductById(id: string): Promise<ProductClientResponse | null>;
  abstract reduceStock(id: string, quantity: number): Promise<void>;
  abstract restoreStock(id: string, quantity: number): Promise<void>;
}
