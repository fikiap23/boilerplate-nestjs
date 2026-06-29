import { validateCacheConfig } from './validate-cache-config.util';

describe('validateCacheConfig', () => {
  it('passes for registered model', () => {
    expect(() => validateCacheConfig('admin')).not.toThrow();
  });

  it('throws for unregistered model', () => {
    expect(() => validateCacheConfig('not_a_real_model')).toThrow(
      /not registered in PrismaSelectPayloadMap/,
    );
  });
});
