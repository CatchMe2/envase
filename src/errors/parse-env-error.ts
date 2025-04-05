import type { EnvvarValidationIssue } from '../types.ts';

export class ParseEnvError extends Error {
  constructor(envvarValidationIssues: EnvvarValidationIssue[]) {
    const parsedIssues = envvarValidationIssues
      .map(
        ({ name, value, messages }) =>
          `  [${name}]:\n    ${messages.join('\n    ')}\n    (received: "${value}")`,
      )
      .join('\n\n');

    super(`Environment variables validation has failed:\n${parsedIssues}\n`);

    this.name = this.constructor.name;
  }
}
