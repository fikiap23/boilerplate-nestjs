import { Inject, Injectable } from '@nestjs/common';

import {
  I{{pascal}}Repository,
} from '../../domain/repositories/{{kebab}}.repository.interface';
import { {{pascal}} } from '../../domain/entities/{{kebab}}.entity';

@Injectable()
export class Get{{pascal}}ByIdUseCase {
  constructor(
    @Inject('I{{pascal}}Repository')
    private readonly {{camel}}Repository: I{{pascal}}Repository,
  ) {}

  async execute(id: string): Promise<{{pascal}}> {
    return await this.{{camel}}Repository.getThrowById({
      id,
      setCache: true,
    });
  }
}
