import { Merchant } from './merchant.entity';

describe('Merchant Domain Entity', () => {
  let merchant: Merchant;

  beforeEach(() => {
    merchant = new Merchant({
      id: 'm-1',
      name: 'Test Merchant',
      slug: 'test-merchant',
    });
  });

  it('should be created with initial attributes', () => {
    expect(merchant.getId()).toBe('m-1');
    expect(merchant.getName()).toBe('Test Merchant');
    expect(merchant.getSlug()).toBe('test-merchant');
  });

  describe('setters and validations', () => {
    it('should throw error when name is empty', () => {
      expect(() => merchant.setName('')).toThrow(
        'Merchant name cannot be empty',
      );
      expect(() => merchant.setName('   ')).toThrow(
        'Merchant name cannot be empty',
      );
    });

    it('should throw error when slug is empty', () => {
      expect(() => merchant.setSlug('')).toThrow(
        'Merchant slug cannot be empty',
      );
      expect(() => merchant.setSlug('   ')).toThrow(
        'Merchant slug cannot be empty',
      );
    });

    it('should update name and slug via setters', () => {
      merchant.setName('New Merchant');
      merchant.setSlug('new-merchant');
      expect(merchant.getName()).toBe('New Merchant');
      expect(merchant.getSlug()).toBe('new-merchant');
    });
  });
});
