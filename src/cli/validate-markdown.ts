const normalizeMarkdown = (content: string): string => {
  return content
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
};

/**
 * Validates if a markdown file matches the expected documentation
 * generated from the environment schema.
 */
export const validateMarkdown = (
  actualMarkdown: string,
  expectedMarkdown: string,
): { isValid: boolean; differences: string[] } => {
  const differences: string[] = [];

  const actual = normalizeMarkdown(actualMarkdown);
  const expected = normalizeMarkdown(expectedMarkdown);

  if (actual === expected) {
    return { isValid: true, differences: [] };
  }

  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');

  const maxLines = Math.max(actualLines.length, expectedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const actualLine = actualLines[i] ?? '';
    const expectedLine = expectedLines[i] ?? '';

    if (actualLine !== expectedLine) {
      if (i >= actualLines.length) {
        differences.push(`Line ${i + 1}: Missing in actual file`);
        differences.push(`  Expected: ${expectedLine}`);
      } else if (i >= expectedLines.length) {
        differences.push(`Line ${i + 1}: Extra line in actual file`);
        differences.push(`  Actual: ${actualLine}`);
      } else {
        differences.push(`Line ${i + 1}: Content mismatch`);
        differences.push(`  Expected: ${expectedLine}`);
        differences.push(`  Actual:   ${actualLine}`);
      }
    }
  }

  return {
    isValid: false,
    differences,
  };
};
