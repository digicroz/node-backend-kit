import { describe, it, expect } from 'vitest';
import { greet } from '../src/index.js';

describe('Index', () => {
  describe('greet', () => {
    it('should return a greeting with the provided name', () => {
      expect(greet('World')).toBe('Hello, World!');
      expect(greet('TypeScript')).toBe('Hello, TypeScript!');
    });
  });
});