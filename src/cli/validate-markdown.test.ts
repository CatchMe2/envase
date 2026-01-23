import { describe, expect, it } from 'vitest';
import { validateMarkdown } from './validate-markdown.ts';

describe('validateMarkdown', () => {
  it('returns valid when markdown matches exactly', () => {
    const markdown = `# Environment variables

## App

- \`PORT\` (required)
  Type: \`number\`
  Description: Application port

`;

    const result = validateMarkdown(markdown, markdown);

    expect(result.isValid).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it('normalizes line endings and multiple newlines', () => {
    const actual = '# Environment variables\r\n\r\n\r\n## App\r\n';
    const expected = '# Environment variables\n\n## App\n';

    const result = validateMarkdown(actual, expected);

    expect(result.isValid).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it('detects missing lines in actual file', () => {
    const actual = `# Environment variables

## App`;
    const expected = `# Environment variables

## App

- \`PORT\` (required)`;

    const result = validateMarkdown(actual, expected);

    expect(result.isValid).toBe(false);
    expect(result.differences.length).toBeGreaterThan(0);
    expect(
      result.differences.some((d) => d.includes('Missing in actual file')),
    ).toBe(true);
  });

  it('detects extra lines in actual file', () => {
    const actual = `# Environment variables

## App

- \`PORT\` (required)
- \`HOST\` (optional)`;
    const expected = `# Environment variables

## App

- \`PORT\` (required)`;

    const result = validateMarkdown(actual, expected);

    expect(result.isValid).toBe(false);
    expect(result.differences).toContain('Line 6: Extra line in actual file');
  });

  it('detects content mismatches', () => {
    const actual = `# Environment variables

- \`PORT\` (optional)`;
    const expected = `# Environment variables

- \`PORT\` (required)`;

    const result = validateMarkdown(actual, expected);

    expect(result.isValid).toBe(false);
    expect(result.differences).toContain('Line 3: Content mismatch');
    expect(result.differences).toContain('  Expected: - `PORT` (required)');
    expect(result.differences).toContain('  Actual:   - `PORT` (optional)');
  });

  it('handles empty strings', () => {
    const result = validateMarkdown('', '');

    expect(result.isValid).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it('reports all differences in a complex mismatch', () => {
    const actual = `# Environment variables

## Database

- \`DB_URL\` (optional)`;
    const expected = `# Environment variables

## App

- \`PORT\` (required)`;

    const result = validateMarkdown(actual, expected);

    expect(result.isValid).toBe(false);
    expect(result.differences.length).toBeGreaterThan(0);
    expect(result.differences).toContain('Line 3: Content mismatch');
    expect(result.differences).toContain('Line 5: Content mismatch');
  });
});
