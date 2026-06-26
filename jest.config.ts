export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  passWithNoTests: true,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
