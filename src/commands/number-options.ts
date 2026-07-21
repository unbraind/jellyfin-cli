/**
 * Produces the validated parse positive int result used by CLI automation.
 * @param value - The value value required by this operation.
 * @param optionName - The option name value required by this operation.
 * @returns - The normalized string representation.
 */
export function parsePositiveInt(value: string, optionName: string): number {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return parsed;
}

/**
 * Produces the validated parse non negative int result used by CLI automation.
 * @param value - The value value required by this operation.
 * @param optionName - The option name value required by this operation.
 * @returns - The normalized string representation.
 */
export function parseNonNegativeInt(value: string, optionName: string): number {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${optionName} must be a non-negative integer.`);
  }
  return parsed;
}
