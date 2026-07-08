export interface MerchantProps {
  id?: string | null;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Merchant {
  private id: string | null = null;
  private name: string = '';
  private slug: string = '';
  private createdAt?: Date;
  private updatedAt?: Date;

  constructor(props: MerchantProps) {
    this.id = props.id || null;
    this.name = props.name;
    this.slug = props.slug;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
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

  public setName(name: string | undefined): void {
    if (name !== undefined) {
      if (name.trim() === '') {
        throw new Error('Merchant name cannot be empty');
      }
      this.name = name;
    }
  }

  public getSlug(): string {
    return this.slug;
  }

  public setSlug(slug: string | undefined): void {
    if (slug !== undefined) {
      if (slug.trim() === '') {
        throw new Error('Merchant slug cannot be empty');
      }
      this.slug = slug;
    }
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  public updateDetails(name?: string, slug?: string): void {
    if (name !== undefined) this.setName(name);
    if (slug !== undefined) this.setSlug(slug);
  }
}
