type JsonSchema = Record<string, unknown>;

type ValidationError = {
  path: string;
  message: string;
};

type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

type SchemaNode = {
  type?: string | string[] | undefined;
  const?: unknown;
  required?: string[] | undefined;
  properties?: Record<string, SchemaNode> | undefined;
  items?: SchemaNode | undefined;
  oneOf?: SchemaNode[] | undefined;
  pattern?: string | undefined;
  format?: string | undefined;
  $ref?: string | undefined;
};

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateTime(value: string): boolean {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function checkType(value: unknown, expected: string): boolean {
  switch (expected) {
    case 'object':
      return isObjectLike(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function resolveRef(root: SchemaNode, ref: string): SchemaNode | null {
  if (!ref.startsWith('#/')) {
    return null;
  }

  const pointer = ref.slice(2).split('/').filter((segment) => segment.length > 0);
  let current: unknown = root;

  for (const segment of pointer) {
    if (!isObjectLike(current)) {
      return null;
    }
    current = current[segment];
  }

  return isObjectLike(current) ? (current as SchemaNode) : null;
}

function validateNode(
  value: unknown,
  schema: SchemaNode,
  rootSchema: SchemaNode,
  path: string,
): ValidationError[] {
  if (schema.$ref) {
    const resolved = resolveRef(rootSchema, schema.$ref);
    if (!resolved) {
      return [{ path, message: `unresolved schema reference: ${schema.$ref}` }];
    }
    return validateNode(value, resolved, rootSchema, path);
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    const hasMatch = schema.oneOf.some((candidate) => validateNode(value, candidate, rootSchema, path).length === 0);
    if (!hasMatch) {
      return [{ path, message: 'did not match any allowed schema variant' }];
    }
  }

  if (schema.const !== undefined && value !== schema.const) {
    return [{ path, message: `must equal constant ${JSON.stringify(schema.const)}` }];
  }

  if (schema.type) {
    const typeCandidates = Array.isArray(schema.type) ? schema.type : [schema.type];
    const typeOk = typeCandidates.some((candidate) => checkType(value, candidate));
    if (!typeOk) {
      return [{ path, message: `expected type ${typeCandidates.join('|')}` }];
    }
  }

  const errors: ValidationError[] = [];

  if (schema.type === 'object' && isObjectLike(value)) {
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in value)) {
          errors.push({ path: path === '$' ? `$.${key}` : `${path}.${key}`, message: 'is required' });
        }
      }
    }

    const properties = schema.properties ?? {};
    for (const [key, childSchema] of Object.entries(properties)) {
      if (!(key in value)) {
        continue;
      }
      const childPath = path === '$' ? `$.${key}` : `${path}.${key}`;
      errors.push(...validateNode(value[key], childSchema, rootSchema, childPath));
    }
  }

  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    value.forEach((entry, index) => {
      errors.push(...validateNode(entry, schema.items as SchemaNode, rootSchema, `${path}[${index}]`));
    });
  }

  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.pattern) {
      const pattern = new RegExp(schema.pattern);
      if (!pattern.test(value)) {
        errors.push({ path, message: `must match pattern ${schema.pattern}` });
      }
    }
    if (schema.format === 'date-time' && !isDateTime(value)) {
      errors.push({ path, message: 'must be a valid date-time string' });
    }
  }

  return errors;
}

export function validateJsonSchema(instance: unknown, schema: JsonSchema): ValidationResult {
  const schemaNode = schema as SchemaNode;
  const errors = validateNode(instance, schemaNode, schemaNode, '$');
  return {
    valid: errors.length === 0,
    errors,
  };
}
