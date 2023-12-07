import type { Config } from 'jest';

const config: Config = {
  clearMocks: true,
  preset: 'ts-jest',
  restoreMocks: true,
  testEnvironment: 'node',
};

export default config;
