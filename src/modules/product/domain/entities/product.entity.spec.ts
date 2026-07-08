import { Product } from './product.entity';
import { Price } from '../value-objects/price.value-object';
import { Stock } from '../value-objects/stock.value-object';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';

describe('Product Domain Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = new Product({
      id: 'p-1',
      name: 'Test Product',
      description: 'Test Description',
      price: new Price(100.0),
      stock: new Stock(50),
      categoryId: 'cat-1',
      merchantId: 'merch-1',
    });
  });

  it('should be created with initial attributes', () => {
    expect(product.getId()).toBe('p-1');
    expect(product.getName()).toBe('Test Product');
    expect(product.getDescription()).toBe('Test Description');
    expect(product.getPrice().getValue()).toBe(100.0);
    expect(product.getStock().getValue()).toBe(50);
    expect(product.getCategoryId()).toBe('cat-1');
    expect(product.getMerchantId()).toBe('merch-1');
  });

  describe('stock reduction', () => {
    it('should reduce stock when quantity is sufficient', () => {
      product.reduceStock(20);
      expect(product.getStock().getValue()).toBe(30);
    });

    it('should throw InsufficientStockException when stock is insufficient', () => {
      expect(() => product.reduceStock(60)).toThrow(InsufficientStockException);
      expect(product.getStock().getValue()).toBe(50); // remains unchanged
    });

    it('should throw error when quantity is zero or negative', () => {
      expect(() => product.reduceStock(0)).toThrow(
        'Quantity to reduce must be greater than 0',
      );
      expect(() => product.reduceStock(-5)).toThrow(
        'Quantity to reduce must be greater than 0',
      );
    });
  });

  describe('stock restoration', () => {
    it('should increase stock', () => {
      product.restoreStock(20);
      expect(product.getStock().getValue()).toBe(70);
    });

    it('should throw error when quantity is zero or negative', () => {
      expect(() => product.restoreStock(0)).toThrow(
        'Quantity to restore must be greater than 0',
      );
      expect(() => product.restoreStock(-5)).toThrow(
        'Quantity to restore must be greater than 0',
      );
    });
  });

  describe('updateDetails', () => {
    it('should update name, description, and price', () => {
      product.updateDetails(
        'Updated Product',
        'Updated Description',
        new Price(150.0),
      );
      expect(product.getName()).toBe('Updated Product');
      expect(product.getDescription()).toBe('Updated Description');
      expect(product.getPrice().getValue()).toBe(150.0);
    });
  });
});
