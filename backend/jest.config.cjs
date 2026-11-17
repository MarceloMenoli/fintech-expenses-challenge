module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.e2e-spec.ts'],
  setupFiles: ['<rootDir>/test/environment.cjs'],
  testTimeout: 30000,
};
