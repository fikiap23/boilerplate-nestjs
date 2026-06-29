import * as fs from 'fs';
import * as path from 'path';

function getRegisteredPayloadMapKeys(): Set<string> {
  const filePath = path.join(
    __dirname,
    '../types/prisma-select-payload.type.ts',
  );
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys = new Set<string>();
  const interfaceMatch = content.match(
    /export interface PrismaSelectPayloadMap \{([\s\S]*?)\}/,
  );

  if (!interfaceMatch) {
    return keys;
  }

  for (const line of interfaceMatch[1].split('\n')) {
    const match = line.trim().match(/^(\w+):/);
    if (match) {
      keys.add(match[1]);
    }
  }

  return keys;
}

export function validateCacheConfig(model: string): void {
  const keys = getRegisteredPayloadMapKeys();

  if (!keys.has(model)) {
    throw new Error(
      `Cache config invalid for model "${model}": not registered in PrismaSelectPayloadMap ` +
        `(src/infrastructure/prisma/types/prisma-select-payload.type.ts).`,
    );
  }
}
