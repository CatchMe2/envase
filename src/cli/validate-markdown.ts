import { styleText } from 'node:util';
import { diffLines } from 'diff';

const normalizeMarkdown = (content: string): string => {
  return content
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
};

type ValidateMarkdownOutput =
  | { isValid: true }
  | { isValid: false; differences: string };

/**
 * Validates if a markdown file matches the expected documentation
 * generated from the environment schema.
 */
export const validateMarkdown = (
  actualMarkdown: string,
  expectedMarkdown: string,
): ValidateMarkdownOutput => {
  const actual = normalizeMarkdown(actualMarkdown);
  const expected = normalizeMarkdown(expectedMarkdown);

  if (actual === expected) {
    return { isValid: true };
  }

  const differences = diffLines(actual, expected)
    .flatMap((change) => {
      const lines = change.value.split('\n');

      // Only remove last element if it's empty (due to trailing newline)
      const linesToProcess =
        lines.length > 0 && lines[lines.length - 1] === ''
          ? lines.slice(0, -1)
          : lines;

      return linesToProcess.map((line) => {
        if (change.added) {
          return styleText('green', `+ ${line}`);
        }
        if (change.removed) {
          return styleText('red', `- ${line}`);
        }
        return styleText('gray', `  ${line}`);
      });
    })
    .join('\n');

  console.log(differences);

  return {
    isValid: false,
    differences,
  };
};
