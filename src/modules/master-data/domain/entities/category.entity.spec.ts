import { Category } from './category.entity';

describe('Category Domain Entity', () => {
  let category: Category;

  beforeEach(() => {
    category = new Category({
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
    });
  });

  it('should be created with initial attributes', () => {
    expect(category.getId()).toBe('cat-1');
    expect(category.getName()).toBe('Electronics');
    expect(category.getSlug()).toBe('electronics');
  });

  describe('setters and validations', () => {
    it('should throw error when name is empty', () => {
      expect(() => category.setName('')).toThrow(
        'Category name cannot be empty',
      );
      expect(() => category.setName('   ')).toThrow(
        'Category name cannot be empty',
      );
    });

    it('should throw error when slug is empty', () => {
      expect(() => category.setSlug('')).toThrow(
        'Category slug cannot be empty',
      );
      expect(() => category.setSlug('   ')).toThrow(
        'Category slug cannot be empty',
      );
    });

    it('should update name and slug via updateDetails', () => {
      category.updateDetails('New Electronics', 'new-electronics');
      expect(category.getName()).toBe('New Electronics');
      expect(category.getSlug()).toBe('new-electronics');
    });
  });
});
