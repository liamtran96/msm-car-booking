import 'reflect-metadata';

// Increase timeout for database operations
jest.setTimeout(60000);

// Suppress console logs during tests (optional - can be enabled if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };
