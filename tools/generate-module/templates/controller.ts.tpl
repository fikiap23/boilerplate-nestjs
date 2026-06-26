import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { {{pascal}}Service } from '../services/{{kebab}}.service';

@ApiTags('{{pascal}} Management')
@Controller('{{route}}')
export class {{pascal}}Controller {
  constructor(private readonly {{camel}}Service: {{pascal}}Service) {}

  // TODO: add endpoints — see src/modules/admin/controllers/admin.controller.ts
}
