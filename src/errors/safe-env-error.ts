import type { EnvvarValidationIssue } from '../types.ts';

const symbol = Symbol.for('ENV_SCHEMA_ERROR');

export class SafeEnvError extends Error {
  readonly issues: EnvvarValidationIssue[];

  constructor(envvarValidationIssues: EnvvarValidationIssue[]) {
    const parsedIssues = envvarValidationIssues
      .map(
        ({ name, value, messages }) =>
          `  [${name}]:\n    ${messages.join('\n    ')}\n    (received: "${value}")`,
      )
      .join('\n\n');

    super(`Environment variables validation has failed:\n${parsedIssues}\n`);

    Object.defineProperty(this, symbol, {
      value: true,
    });
    this.name = this.constructor.name;
    this.issues = envvarValidationIssues;
  }

  static isInstance(error: unknown): error is SafeEnvError {
    return (
      error !== null &&
      typeof error === 'object' &&
      symbol in error &&
      error[symbol] === true
    );
  }
}
