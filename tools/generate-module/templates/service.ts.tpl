import { Inject, Injectable } from '@nestjs/common';

import {
  I{{pascal}}Repository,
} from '../../domain/repositories/{{kebab}}.repository.interface';
import { {{pascal}} } from '../../domain/entities/{{kebab}}.entity';

@Injectable()
export class {{pascal}}Service {
  constructor(
    @Inject('I{{pascal}}Repository')
    private readonly {{camel}}Repository: I{{pascal}}Repository,
  ) {}

  async handleGetById(id: string): Promise<{{pascal}}> {
    return await this.{{camel}}Repository.getThrowById({
      id,
      setCache: true,
    });
  }

  // TODO: add more handle* methods — see src/modules/admin/application/services/admin.service.ts
}
