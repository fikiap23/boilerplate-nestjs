export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  passWithNoTests: false,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^prisma/(.*)$': '<rootDir>/prisma/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/build/'],
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
};
