import { Prisma } from '@prisma/client';
import { RepositoryLockConfig } from '../types/row-lock-options.type';

function findModelByTableName(tableName: string) {
  return Prisma.dmmf.datamodel.models.find((model) => {
    const mappedTable = model.dbName ?? model.name;
    return mappedTable === tableName;
  });
}

function getScalarFields(model: (typeof Prisma.dmmf.datamodel.models)[number]) {
  return model.fields.filter((field) => field.kind === 'scalar');
}

function expectedDbColumn(
  field: (typeof Prisma.dmmf.datamodel.models)[number]['fields'][number],
): string {
  return field.dbName ?? field.name;
}

/**
 * Validates lock config against Prisma DMMF (@map / @@map).
 * Called at repository factory init — fails fast on misconfiguration.
 */
export function validateLockConfig(lock: RepositoryLockConfig): void {
  const model = findModelByTableName(lock.tableName);
  if (!model) {
    const tables = Prisma.dmmf.datamodel.models.map((m) => m.dbName ?? m.name);
    throw new Error(
      `Row lock: no Prisma model for table "${lock.tableName}". Known tables: ${tables.join(', ')}`,
    );
  }

  const columns = lock.columns ?? {};
  const scalarFields = getScalarFields(model);
  const errors: string[] = [];

  for (const field of scalarFields) {
    if (!field.dbName) continue;

    if (!(field.name in columns)) {
      errors.push(
        `missing lock.columns["${field.name}"] (Prisma @map("${field.dbName}"))`,
      );
      continue;
    }

    if (columns[field.name] !== field.dbName) {
      errors.push(
        `lock.columns["${field.name}"] is "${columns[field.name]}" but schema expects "${field.dbName}"`,
      );
    }
  }

  for (const [prismaField, dbColumn] of Object.entries(columns)) {
    const field = scalarFields.find((f) => f.name === prismaField);
    if (!field) {
      errors.push(
        `lock.columns["${prismaField}"] has no scalar field on model ${model.name}`,
      );
      continue;
    }

    const expected = expectedDbColumn(field);
    if (dbColumn !== expected) {
      errors.push(
        `lock.columns["${prismaField}"] is "${dbColumn}" but expected "${expected}"`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Row lock config invalid for table "${lock.tableName}" (model ${model.name}):\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}
