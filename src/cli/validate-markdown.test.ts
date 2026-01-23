import { stripVTControlCharacters } from 'node:util';
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
  });

  it('normalizes line endings and multiple newlines', () => {
    const actual = '# Environment variables\r\n\r\n\r\n## App\r\n';
    const expected = '# Environment variables\n\n## App\n';

    const result = validateMarkdown(actual, expected);

    expect(result.isValid).toBe(true);
  });

  it('shows mixed changes with all prefix types', () => {
    const actual = `# Environment variables

## App

- \`PORT\` (required)
- \`HOST\` (optional)`;
    const expected = `# Environment variables

## App

- \`PORT\` (required)
- \`URL\` (required)`;

    const result = validateMarkdown(actual, expected);

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      const plain = stripVTControlCharacters(result.differences);

      // Should contain unchanged lines
      expect(plain).toContain('  # Environment variables');
      expect(plain).toContain('  ## App');
      expect(plain).toContain('  - `PORT` (required)');
      // Should contain removed line
      expect(plain).toContain('- - `HOST` (optional)');
      // Should contain added line
      expect(plain).toContain('+ - `URL` (required)');
    }
  });
});
