export class Stock {
  constructor(private readonly value: number) {
    if (value < 0) {
      throw new Error('Stock cannot be negative');
    }
  }

  public getValue(): number {
    return this.value;
  }

  public increase(quantity: number): Stock {
    return new Stock(this.value + quantity);
  }

  public decrease(quantity: number): Stock {
    return new Stock(this.value - quantity);
  }

  public equals(other: Stock): boolean {
    return this.value === other.getValue();
  }
}
