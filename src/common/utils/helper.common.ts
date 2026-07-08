import { isUUID } from 'class-validator';
import { CustomError } from 'src/common/exceptions/custom-error';

/**
  Validates that a given string is a valid UUID format, throws error if invalid

  @param id - The string to validate as UUID
  @param model - The model name used in the error message for context

  @throws CustomError with status 400 if the ID is not a valid UUID
**/
export const validateUUID = (id: string, model: string) => {
  if (!isUUID(id)) {
    throw new CustomError({
      statusCode: 400,
      message: `Invalid ${model} ID`,
    });
  }
};

/**
 * Splits a Prisma select object into flat DB columns and relations.
 * Automatically resolves the foreign key (e.g. category -> categoryId)
 * if it exists in the model's scalar fields.
 *
 * @param select - The Prisma select preset object
 * @param scalarFieldEnum - The Prisma model's ScalarFieldEnum object (e.g. Prisma.ProductScalarFieldEnum)
 */
export function splitSelect<T extends object>(
  select: T,
  scalarFieldEnum: Record<string, string>,
) {
  const dbSelect: Record<string, any> = {};
  const relations: Record<string, any> = {};
  const scalarFields = new Set(Object.keys(scalarFieldEnum));

  for (const [key, value] of Object.entries(select)) {
    if (value && typeof value === 'object') {
      relations[key] = value;
      // Resolve foreign key name (camelCase, e.g. category -> categoryId)
      const foreignKey = `${key}Id`;
      if (scalarFields.has(foreignKey)) {
        dbSelect[foreignKey] = true;
      }
    } else {
      dbSelect[key] = value;
    }
  }

  return {
    dbSelect: dbSelect as T,
    relations,
  };
}
