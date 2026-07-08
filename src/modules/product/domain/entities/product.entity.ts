import { Price } from '../value-objects/price.value-object';
import { Stock } from '../value-objects/stock.value-object';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';

export interface ProductAssociatedCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductAssociatedMerchant {
  id: string;
  name: string;
  slug: string;
}

export interface ProductProps {
  id?: string | null;
  name: string;
  description?: string | null;
  price: Price;
  stock: Stock;
  categoryId: string;
  merchantId: string;
  createdAt?: Date;
  updatedAt?: Date;
  category?: ProductAssociatedCategory;
  merchant?: ProductAssociatedMerchant;
}

export class Product {
  private id: string | null = null;
  private name: string;
  private description: string | null = null;
  private price: Price;
  private stock: Stock;
  private categoryId: string;
  private merchantId: string;
  private createdAt?: Date;
  private updatedAt?: Date;
  private category?: ProductAssociatedCategory;
  private merchant?: ProductAssociatedMerchant;

  constructor(props: ProductProps) {
    this.id = props.id || null;
    this.name = props.name;
    this.description = props.description || null;
    this.price = props.price;
    this.stock = props.stock;
    this.categoryId = props.categoryId;
    this.merchantId = props.merchantId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.category = props.category;
    this.merchant = props.merchant;
  }

  public getId(): string | null {
    return this.id;
  }

  public setId(id: string | null): void {
    this.id = id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string | null {
    return this.description;
  }

  public getPrice(): Price {
    return this.price;
  }

  public getStock(): Stock {
    return this.stock;
  }

  public getCategoryId(): string {
    return this.categoryId;
  }

  public getMerchantId(): string {
    return this.merchantId;
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  public getCategory(): ProductAssociatedCategory | undefined {
    return this.category;
  }

  public getMerchant(): ProductAssociatedMerchant | undefined {
    return this.merchant;
  }

  public updateDetails(props: {
    name: string;
    description?: string | null;
    price: Price;
    categoryId?: string;
  }): void {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Product name cannot be empty');
    }
    this.name = props.name;
    if (props.description !== undefined) {
      this.description = props.description;
    }
    this.price = props.price;
    if (props.categoryId) {
      this.categoryId = props.categoryId;
    }
  }

  public reduceStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity to reduce must be greater than 0');
    }
    if (this.stock.getValue() < quantity) {
      throw new InsufficientStockException(this.name);
    }
    this.stock = this.stock.decrease(quantity);
  }

  public restoreStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity to restore must be greater than 0');
    }
    this.stock = this.stock.increase(quantity);
  }
}
