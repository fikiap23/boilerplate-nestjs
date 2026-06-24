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
