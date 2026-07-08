import { AdminClientResponse } from './admin.response';

export abstract class AdminClient {
  abstract getAdmin(id: string): Promise<AdminClientResponse | null>;
}
