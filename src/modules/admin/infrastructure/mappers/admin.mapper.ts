import { Admin } from '../../domain/entities/admin.entity';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

export class AdminMapper {
  static toDomain(raw: any): Admin {
    if (!raw) return null;
    return new Admin({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      password: raw.password,
      role: raw.role,
      status: raw.status,
      createdAt: raw.createdAt,
      lastLoginAt: raw.lastLoginAt,
    });
  }

  static toPersistenceCreate(domain: Admin): Prisma.AdminCreateInput {
    return {
      id: domain.getId() || undefined,
      name: domain.getName(),
      email: domain.getEmail(),
      password: domain.getPassword() || '',
      role: domain.getRole(),
      status: domain.getStatus(),
      lastLoginAt: domain.getLastLoginAt(),
    };
  }

  static toPersistenceUpdate(domain: Admin | any): Prisma.AdminUpdateInput {
    if (domain instanceof Admin) {
      return {
        name: domain.getName(),
        email: domain.getEmail(),
        password: domain.getPassword(),
        role: domain.getRole(),
        status: domain.getStatus(),
        lastLoginAt: domain.getLastLoginAt(),
      };
    }
    return domain;
  }
}
