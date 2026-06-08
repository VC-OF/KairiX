import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('should merge classes correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('should override conflicting tailwind classes correctly', () => {
    // bg-red-500 should be overwritten by bg-blue-500
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = cn(
      'px-4 py-2',
      true && 'text-white',
      false && 'text-black',
      null,
      undefined,
      'rounded'
    );
    expect(result).toBe('px-4 py-2 text-white rounded');
  });
});
