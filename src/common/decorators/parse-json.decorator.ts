// common/decorators/parse-json.decorator.ts
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/**
 * Transforms a JSON string into a JavaScript object.
 * Throws a BadRequestException if the string is invalid JSON.
 * If the value is null/undefined, it returns undefined (for optional fields).
 */
export function ParseJson(errorMessage?: string) {
  return Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException(errorMessage ?? 'Invalid JSON format');
    }
  });
}
