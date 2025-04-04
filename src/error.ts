export type EnvvarValidationError = {
  name: string;
  value?: string;
  messages: string[];
};

export class ParseConfigError extends Error {
  constructor(envvarValidationErrors: EnvvarValidationError[]) {
    const parsedErrors = envvarValidationErrors
      .map(
        ({ name, value, messages }) =>
          `  [${name}]:\n    ${messages.join('\n    ')}\n    (received: "${value}")`,
      )
      .join('\n\n');

    super(`Environment variables validation has failed:\n${parsedErrors}\n`);

    this.name = this.constructor.name;
  }
}
