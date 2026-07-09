export interface {{pascal}}Props {
  id?: string | null;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class {{pascal}} {
  private id: string | null = null;
  private name: string = '';
  private createdAt?: Date;
  private updatedAt?: Date;

  constructor(props: {{pascal}}Props) {
    this.id = props.id || null;
    this.name = props.name;
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
        throw new Error('{{pascal}} name cannot be empty');
      }
      this.name = name;
    }
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  public updateDetails(name?: string): void {
    if (name !== undefined) this.setName(name);
  }
}
