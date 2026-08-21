/** Converte null/undefined/string vazia em undefined para @IsOptional(). */
export function optionalEmptyValue({ value }: { value: unknown }) {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}
