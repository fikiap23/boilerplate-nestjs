export interface IFormatResponse {
  isSuccess: boolean;
  message: string;
  data: any;
  meta?: any;
}

export type IMessageStatusCode = Pick<IFormatResponse, 'isSuccess' | 'message'>;
export type IFormatErrorResponse = Pick<
  IFormatResponse,
  'isSuccess' | 'message'
>;
