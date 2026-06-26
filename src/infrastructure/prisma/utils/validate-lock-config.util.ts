import * as fs from 'fs';
import * as path from 'path';
import { RepositoryLockConfig } from '../types/row-lock-options.type';

type SchemaField = {
  name: string;
  dbName?: string;
  kind: 'scalar' | 'object' | 'enum';
};

type SchemaModel = {
  name: string;
  dbName?: string;
  fields: SchemaField[];
};

function parsePrismaSchema(schemaPath: string): SchemaModel[] {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models: SchemaModel[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;

  for (const match of content.matchAll(modelRegex)) {
    const modelName = match[1];
    const body = match[2];
    const tableMap = body.match(/@@map\("([^"]+)"\)/);
    const fields: SchemaField[] = [];

    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
        continue;
      }

      const fieldMatch = trimmed.match(/^(\w+)\s+/);
      if (!fieldMatch) continue;

      const name = fieldMatch[1];
      const dbMap = trimmed.match(/@map\("([^"]+)"\)/);
      const isRelation =
        trimmed.includes('[]') &&
        !trimmed.match(/@(db\.|default|map|id|unique)/);

      fields.push({
        name,
        dbName: dbMap?.[1],
        kind: isRelation ? 'object' : 'scalar',
      });
    }

    models.push({
      name: modelName,
      dbName: tableMap?.[1],
      fields,
    });
  }

  return models;
}

function getSchemaModels(): SchemaModel[] {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  return parsePrismaSchema(schemaPath);
}

function findModelByTableName(tableName: string): SchemaModel | undefined {
  return getSchemaModels().find((model) => {
    const mappedTable = model.dbName ?? model.name;
    return mappedTable === tableName;
  });
}

function getScalarFields(model: SchemaModel): SchemaField[] {
  return model.fields.filter((field) => field.kind === 'scalar');
}

function expectedDbColumn(field: SchemaField): string {
  return field.dbName ?? field.name;
}

/**
 * Validates lock config against prisma/schema.prisma (@map / @@map).
 * Called at repository factory init — fails fast on misconfiguration.
 */
export function validateLockConfig(lock: RepositoryLockConfig): void {
  const model = findModelByTableName(lock.tableName);
  if (!model) {
    const tables = getSchemaModels().map((m) => m.dbName ?? m.name);
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
