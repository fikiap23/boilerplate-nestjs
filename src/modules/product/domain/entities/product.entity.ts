import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { Price } from '../value-objects/price.value-object';
import { Stock } from '../value-objects/stock.value-object';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';

export class Product {
  private id: string | null = null;
  private name: string = '';
  private description: string | null = null;
  private price: Price = new Price(0);
  private stock: Stock = new Stock(0);
  private categoryId: string = '';
  private merchantId: string = '';
  private createdAt?: Date;
  private updatedAt?: Date;

  constructor(
    id?: string | null,
    name?: string,
    description?: string | null,
    price?: Price,
    stock?: Stock,
    categoryId?: string,
    merchantId?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    if (id !== undefined) this.id = id;
    if (name !== undefined) this.name = name;
    if (description !== undefined) this.description = description;
    if (price !== undefined) this.price = price;
    if (stock !== undefined) this.stock = stock;
    if (categoryId !== undefined) this.categoryId = categoryId;
    if (merchantId !== undefined) this.merchantId = merchantId;
    if (createdAt !== undefined) this.createdAt = createdAt;
    if (updatedAt !== undefined) this.updatedAt = updatedAt;
  }

  public getId(): string | null {
    return this.id;
  }

  public setId(id: string | null): void {
    if (id !== undefined) {
      this.id = id;
    }
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string | undefined): void {
    if (name !== undefined) {
      this.name = name;
    }
  }

  public getDescription(): string | null {
    return this.description;
  }

  public setDescription(description: string | null | undefined): void {
    if (description !== undefined) {
      this.description = description;
    }
  }

  public getPrice(): Price {
    return this.price;
  }

  public setPrice(price: Price | number | undefined): void {
    if (price !== undefined) {
      this.price = price instanceof Price ? price : new Price(price);
    }
  }

  public getStock(): Stock {
    return this.stock;
  }

  public setStock(stock: Stock | number | undefined): void {
    if (stock !== undefined) {
      this.stock = stock instanceof Stock ? stock : new Stock(stock);
    }
  }

  public getCategoryId(): string {
    return this.categoryId;
  }

  public setCategoryId(categoryId: string | undefined): void {
    if (categoryId !== undefined) {
      this.categoryId = categoryId;
    }
  }

  public getMerchantId(): string {
    return this.merchantId;
  }

  public setMerchantId(merchantId: string | undefined): void {
    if (merchantId !== undefined) {
      this.merchantId = merchantId;
    }
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public setCreatedAt(createdAt: Date | undefined): void {
    if (createdAt !== undefined) {
      this.createdAt = createdAt;
    }
  }

  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  public setUpdatedAt(updatedAt: Date | undefined): void {
    if (updatedAt !== undefined) {
      this.updatedAt = updatedAt;
    }
  }

  public updateDetails(
    name: string,
    description: string | null,
    price: Price,
  ): void {
    this.name = name;
    this.description = description;
    this.price = price;
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

  static fromPrisma(raw: any): Product {
    return new Product(
      raw.id,
      raw.name,
      raw.description,
      new Price(Number(raw.price)),
      new Stock(raw.stock),
      raw.categoryId,
      raw.merchantId,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  toPrismaCreate(): Prisma.ProductCreateInput {
    return {
      id: this.id || undefined,
      name: this.name,
      description: this.description,
      price: new Prisma.Decimal(this.price.getValue()),
      stock: this.stock.getValue(),
      category: { connect: { id: this.categoryId } },
      merchant: { connect: { id: this.merchantId } },
    };
  }

  toPrismaUpdate(): Prisma.ProductUpdateInput {
    return {
      name: this.name,
      description: this.description,
      price: new Prisma.Decimal(this.price.getValue()),
      stock: this.stock.getValue(),
      category: { connect: { id: this.categoryId } },
      merchant: { connect: { id: this.merchantId } },
    };
  }
}
