import { Admin } from './admin.entity';

describe('Admin Domain Entity', () => {
  let admin: Admin;

  beforeEach(() => {
    admin = new Admin({
      id: 'a-1',
      name: 'Super Admin',
      email: 'super@admin.com',
      password: 'passwordhash',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
    });
  });

  it('should be created with initial attributes', () => {
    expect(admin.getId()).toBe('a-1');
    expect(admin.getName()).toBe('Super Admin');
    expect(admin.getEmail()).toBe('super@admin.com');
    expect(admin.getPassword()).toBe('passwordhash');
    expect(admin.getRole()).toBe('SUPERADMIN');
    expect(admin.getStatus()).toBe('ACTIVE');
  });

  describe('validations', () => {
    it('should throw error when name is empty', () => {
      expect(() => admin.setName('')).toThrow('Admin name cannot be empty');
    });

    it('should throw error when email is invalid', () => {
      expect(() => admin.setEmail('invalidemail')).toThrow(
        'Invalid email format',
      );
    });

    it('should update name and email via updateProfile', () => {
      admin.updateProfile('New Admin', 'new@admin.com');
      expect(admin.getName()).toBe('New Admin');
      expect(admin.getEmail()).toBe('new@admin.com');
    });
  });
});
