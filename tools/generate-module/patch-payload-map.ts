import * as fs from 'fs';
import * as path from 'path';
import { ModuleNames } from './naming';

export function patchPayloadMap(
  projectRoot: string,
  names: ModuleNames,
  dryRun: boolean,
): void {
  const payloadMapPath = path.join(
    projectRoot,
    'src',
    'infrastructure',
    'prisma',
    'types',
    'prisma-select-payload.type.ts',
  );

  let content = fs.readFileSync(payloadMapPath, 'utf-8');
  const interfaceEntry = `  ${names.repoModel}: Prisma.${names.pascal}Select;`;
  const payloadEntry = `  ${names.repoModel}: Prisma.${names.pascal}GetPayload<{ select: TSelect }>;`;

  if (content.includes(interfaceEntry)) {
    throw new Error(
      `Model "${names.repoModel}" is already in PrismaSelectPayloadMap`,
    );
  }

  const interfaceMatch = content.match(
    /export interface PrismaSelectPayloadMap \{([\s\S]*?)^\}/m,
  );
  if (!interfaceMatch) {
    throw new Error('Could not find PrismaSelectPayloadMap interface');
  }

  const interfaceBody = interfaceMatch[1].replace(/\s+$/, '');
  content = content.replace(
    interfaceMatch[0],
    `export interface PrismaSelectPayloadMap {${interfaceBody}\n${interfaceEntry}\n}`,
  );

  const payloadMatch = content.match(
    /type GetPayloadForModel[\s\S]*?= \{([\s\S]*?)^\}\[TRepoModel\];/m,
  );
  if (!payloadMatch) {
    throw new Error('Could not find GetPayloadForModel type');
  }

  const payloadBody = payloadMatch[1].replace(/\s+$/, '');
  content = content.replace(
    payloadMatch[0],
    payloadMatch[0].replace(
      payloadMatch[1],
      `${payloadBody}\n${payloadEntry}\n`,
    ),
  );

  if (dryRun) {
    console.log(
      '[dry-run] would patch src/infrastructure/prisma/types/prisma-select-payload.type.ts',
    );
    return;
  }

  fs.writeFileSync(payloadMapPath, content, 'utf-8');
  console.log(
    'patched src/infrastructure/prisma/types/prisma-select-payload.type.ts',
  );
}
