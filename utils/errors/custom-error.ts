export class CustomError extends Error {
  statusCode: number;

  constructor({
    message,
    statusCode,
  }: {
    message: string;
    statusCode: number;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
