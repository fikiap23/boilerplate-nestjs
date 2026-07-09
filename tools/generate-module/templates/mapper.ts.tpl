import { {{pascal}} } from '../../domain/entities/{{kebab}}.entity';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

export class {{pascal}}Mapper {
  static toDomain(raw: any): {{pascal}} {
    if (!raw) return null;
    return new {{pascal}}({
      id: raw.id,
      name: raw.name,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistenceCreate(domain: {{pascal}}): Prisma.{{pascal}}CreateInput {
    return {
      id: domain.getId() || undefined,
      name: domain.getName(),
    };
  }

  static toPersistenceUpdate(domain: {{pascal}}): Prisma.{{pascal}}UpdateInput {
    return {
      name: domain.getName(),
    };
  }
}
