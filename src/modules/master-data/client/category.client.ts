import { CategoryClientResponse } from './category.response';

export abstract class CategoryClient {
  abstract getCategoryById(id: string): Promise<CategoryClientResponse | null>;
  abstract getCategoriesByIds(ids: string[]): Promise<CategoryClientResponse[]>;
}
