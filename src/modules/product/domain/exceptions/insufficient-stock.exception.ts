import { HttpStatus } from '@nestjs/common';
import { CustomError } from 'src/common/exceptions/custom-error';

export class InsufficientStockException extends CustomError {
  constructor(productName: string) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Insufficient stock for product: ${productName}`,
    });
    Object.setPrototypeOf(this, InsufficientStockException.prototype);
  }
}
