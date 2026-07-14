import { Injectable } from '@nestjs/common';

export interface RegisteredRepository {
  repository: {
    // `any` (not `unknown`) so concrete repo getMany generics remain assignable —
    // callers in AutoComposeHelper pass dynamically shaped where/select.
    getMany: (args: {
      where?: any;
      select?: any;
      setCache?: boolean;
    }) => Promise<any[]>;
  };
  scalarFields?: Record<string, string>;
}

@Injectable()
export class RepositoryRegistry {
  private readonly repos = new Map<string, RegisteredRepository>();

  register(model: string, entry: RegisteredRepository): void {
    this.repos.set(model, entry);
  }

  get(model: string): RegisteredRepository | undefined {
    return this.repos.get(model);
  }

  getOrThrow(model: string): RegisteredRepository {
    const entry = this.repos.get(model);
    if (!entry) {
      throw new Error(
        `No repository registered for relation/model "${model}". Ensure the repository is created with model: '${model}' and its module is loaded.`,
      );
    }
    return entry;
  }
}
