import { Injectable } from '@nestjs/common';

import { {{pascal}}Repository } from '../repositories/{{kebab}}.repository';
import { get{{pascal}}Select } from '../types/select-{{kebab}}.type';

@Injectable()
export class {{pascal}}Service {
  constructor(private readonly {{camel}}Repository: {{pascal}}Repository) {}

  async handleGetById(id: string) {
    return await this.{{camel}}Repository.getThrowById({
      id,
      select: get{{pascal}}Select('general'),
    });
  }

  // TODO: add more handle* methods — see src/modules/admin/services/admin.service.ts
}
