import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
    expect(cn('foo', { bar: false, baz: true })).toBe('foo baz');
    expect(cn({ foo: true }, { bar: true })).toBe('foo bar');
    expect(cn({ foo: false }, { bar: true, baz: false })).toBe('bar');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('p-2 m-2', 'p-4')).toBe('m-2 p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500', 'bg-opacity-50')).toBe('bg-red-500 bg-opacity-50'); // Opacity should be appended
    expect(cn('p-2', 'px-4')).toBe('p-2 px-4'); // p-2 and px-4 are different, so both should be present
    expect(cn('m-4', 'mx-2')).toBe('m-4 mx-2'); // m-4 and mx-2 are different
  });

  it('should deduplicate class names', () => {
    expect(cn('foo', 'foo', 'bar', 'bar')).toBe('foo bar');
    expect(cn('foo foo bar bar')).toBe('foo bar');
    expect(cn('text-red-500 text-red-500')).toBe('text-red-500');
  });

  it('should handle various input types', () => {
    expect(cn('foo', ['bar', 'baz'], { qux: true, quux: false })).toBe('foo bar baz qux');
    expect(cn(null, undefined, 'foo', false, '', ['bar', null, 'baz'])).toBe('foo bar baz');
  });

  it('should return an empty string for no inputs or all falsy inputs', () => {
    expect(cn()).toBe('');
    expect(cn(null, undefined, false, '')).toBe('');
  });
});
