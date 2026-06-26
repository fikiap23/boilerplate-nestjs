import * as fs from 'fs';
import * as path from 'path';
import { ModuleNames } from './naming';

export interface PrismaModelInfo {
  name: string;
  fields: string[];
  hasPassword: boolean;
  hasCreatedAt: boolean;
}

function parsePrismaModels(schemaPath: string): PrismaModelInfo[] {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models: PrismaModelInfo[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;

  for (const match of content.matchAll(modelRegex)) {
    const name = match[1];
    const body = match[2];
    const fields: string[] = [];

    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
        continue;
      }

      const fieldMatch = trimmed.match(/^(\w+)\s+/);
      if (fieldMatch) {
        fields.push(fieldMatch[1]);
      }
    }

    models.push({
      name,
      fields,
      hasPassword: fields.includes('password'),
      hasCreatedAt: fields.includes('createdAt'),
    });
  }

  return models;
}

export function getPrismaModel(
  schemaPath: string,
  pascalModel: string,
): PrismaModelInfo | undefined {
  return parsePrismaModels(schemaPath).find((m) => m.name === pascalModel);
}

export function validateGeneration(
  names: ModuleNames,
  options: {
    projectRoot: string;
    cacheEnabled: boolean;
  },
): PrismaModelInfo {
  const moduleDir = path.join(
    options.projectRoot,
    'src',
    'modules',
    names.kebab,
  );

  if (fs.existsSync(moduleDir)) {
    throw new Error(`Module folder already exists: ${moduleDir}`);
  }

  const schemaPath = path.join(options.projectRoot, 'prisma', 'schema.prisma');
  const model = getPrismaModel(schemaPath, names.pascal);

  if (!model) {
    throw new Error(
      `Prisma model "${names.pascal}" not found in prisma/schema.prisma.\n` +
        'Create the model and run `npx prisma migrate dev`, then re-run the generator.',
    );
  }

  const appModulePath = path.join(options.projectRoot, 'src', 'app.module.ts');
  const appModuleContent = fs.readFileSync(appModulePath, 'utf-8');
  const moduleImport = `${names.pascal}Module`;

  if (appModuleContent.includes(moduleImport)) {
    throw new Error(
      `${moduleImport} is already registered in src/app.module.ts.`,
    );
  }

  if (options.cacheEnabled) {
    const payloadMapPath = path.join(
      options.projectRoot,
      'src',
      'infrastructure',
      'prisma',
      'types',
      'prisma-select-payload.type.ts',
    );
    const payloadMapContent = fs.readFileSync(payloadMapPath, 'utf-8');
    const mapKey = `${names.repoModel}: Prisma.${names.pascal}Select`;

    if (payloadMapContent.includes(mapKey)) {
      throw new Error(
        `Model "${names.repoModel}" is already registered in PrismaSelectPayloadMap.`,
      );
    }
  }

  return model;
}
