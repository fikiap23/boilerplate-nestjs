import { PRISMA_SELECT_PAYLOAD_MODEL_KEYS } from '../types/prisma-select-payload.type';

export function validateCacheConfig(model: string): void {
  if (
    !(PRISMA_SELECT_PAYLOAD_MODEL_KEYS as readonly string[]).includes(model)
  ) {
    throw new Error(
      `Cache config invalid for model "${model}": not registered in PrismaSelectPayloadMap ` +
        `(src/infrastructure/prisma/types/prisma-select-payload.type.ts).`,
    );
  }
}
