import '@testing-library/jest-dom';

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  back: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(() => Promise.resolve()),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock environment variables
Object.defineProperty(process.env, 'NEXT_PUBLIC_OLLAMA_URL', {
  value: 'http://localhost:11434',
  writable: true,
});

Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true,
});

// Mock antd notification
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  notification: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock useLlmStore
jest.mock('../lib/store/llmStore', () => ({
  useLlmStore: () => ({
    models: [],
    fetchModels: jest.fn(),
    startModel: jest.fn(),
    stopModel: jest.fn(),
    deleteModel: jest.fn(),
    updateModel: jest.fn(),
    testModel: jest.fn(),
    scanModels: jest.fn(),
  }),
}));
