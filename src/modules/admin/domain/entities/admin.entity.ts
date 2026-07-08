export interface AdminProps {
  id?: string | null;
  name: string;
  email: string;
  password?: string;
  role: string;
  status: string;
  createdAt?: Date;
  lastLoginAt?: Date | null;
}

export class Admin {
  private id: string | null = null;
  private name: string = '';
  private email: string = '';
  private password?: string;
  private role: string = '';
  private status: string = '';
  private createdAt?: Date;
  private lastLoginAt?: Date | null;

  constructor(props: AdminProps) {
    this.id = props.id || null;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.role = props.role;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.lastLoginAt = props.lastLoginAt ?? null;
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
        throw new Error('Admin name cannot be empty');
      }
      this.name = name;
    }
  }

  public getEmail(): string {
    return this.email;
  }

  public setEmail(email: string | undefined): void {
    if (email !== undefined) {
      if (email.trim() === '' || !email.includes('@')) {
        throw new Error('Invalid email format');
      }
      this.email = email;
    }
  }

  public getPassword(): string | undefined {
    return this.password;
  }

  public setPassword(password: string | undefined): void {
    if (password !== undefined) {
      if (password.trim() === '') {
        throw new Error('Password cannot be empty');
      }
      this.password = password;
    }
  }

  public getRole(): string {
    return this.role;
  }

  public setRole(role: string | undefined): void {
    if (role !== undefined) {
      this.role = role;
    }
  }

  public getStatus(): string {
    return this.status;
  }

  public setStatus(status: string | undefined): void {
    if (status !== undefined) {
      this.status = status;
    }
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public getLastLoginAt(): Date | null | undefined {
    return this.lastLoginAt;
  }

  public setLastLoginAt(lastLoginAt: Date | null | undefined): void {
    if (lastLoginAt !== undefined) {
      this.lastLoginAt = lastLoginAt;
    }
  }

  public updateProfile(
    name?: string,
    email?: string,
    passwordHash?: string,
  ): void {
    if (name !== undefined) this.setName(name);
    if (email !== undefined) this.setEmail(email);
    if (passwordHash !== undefined) this.setPassword(passwordHash);
  }
}
