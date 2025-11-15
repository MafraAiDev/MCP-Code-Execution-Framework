export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/test/**/*.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'test-integracao-real.js',
    'test-mcp-execution-real.js'
  ],
  collectCoverageFrom: [
    'core/**/*.js',
    'servers/**/*.js',
    '!**/node_modules/**',
    '!**/test/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};