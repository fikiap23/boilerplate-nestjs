import { Injectable } from '@nestjs/common';

import { {{pascal}}Repository } from '../repositories/{{kebab}}.repository';

@Injectable()
export class {{pascal}}Service {
  constructor(private readonly {{camel}}Repository: {{pascal}}Repository) {}

  // TODO: add handle* methods — see src/modules/admin/services/admin.service.ts
}
