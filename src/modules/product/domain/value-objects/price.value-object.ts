export class Price {
  constructor(private readonly value: number) {
    if (value < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: Price): boolean {
    return this.value === other.getValue();
  }
}
