/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Relax module resolution for Jest (bundler is not supported in ts-jest)
        moduleResolution: 'node',
      },
    }],
  },
  testMatch: ['**/*.test.ts'],
};

module.exports = config;
