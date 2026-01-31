import { z } from 'zod';

export const FactCategoryEnum = z.enum([
  'dependency', 'version', 'constraint', 'architecture', 'decision',
  'ownership', 'expertise', 'bug', 'tech_debt', 'rule', 'status',
]);

export const FactStatusEnum = z.enum(['active', 'superseded']);

export const LinkSchema = z.object({
  entityType: z.enum(['projects', 'libraries', 'patterns']),
  slug: z.string().min(1),
  relation: z.enum([
    'uses', 'implements', 'depends_on', 'extends', 'references',
    'used_by', 'implemented_by', 'depended_on_by', 'extended_by', 'referenced_by'
  ]),
});

export const FactItemSchema = z.object({
  id: z.string().min(1),
  fact: z.string().min(1),
  category: FactCategoryEnum,
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().min(1),
  status: FactStatusEnum,
  supersededBy: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.string().optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  links: z.array(LinkSchema).optional(),
});

export const FactItemsArraySchema = z.array(FactItemSchema);

export const ExtractionProposalSchema = z.object({
  entityType: z.enum(['projects', 'libraries', 'patterns']),
  entityName: z.string().min(1),
  fact: z.string().min(1),
  category: FactCategoryEnum,
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.string().optional(),
  links: z.array(LinkSchema).optional(),
});

export const ExtractionProposalsSchema = z.array(ExtractionProposalSchema);

export const AuditEntrySchema = z.object({
  timestamp: z.string(),
  operation: z.string(),
  source: z.string(),
  entitiesAffected: z.array(z.string()),
  factsAdded: z.number().int().min(0),
  factsSuperseded: z.number().int().min(0).optional(),
  status: z.enum(['ok', 'error', 'warning']),
  details: z.string().optional(),
});

export const AuditLogSchema = z.array(AuditEntrySchema);

export const DecisionStatusEnum = z.enum(['active', 'superseded', 'under_review']);

export type Link = z.infer<typeof LinkSchema>;
export type EntityType = z.infer<typeof ExtractionProposalSchema>['entityType'];
export type FactItem = z.infer<typeof FactItemSchema>;
export type FactCategory = z.infer<typeof FactCategoryEnum>;
export type FactStatus = z.infer<typeof FactStatusEnum>;
export type ExtractionProposal = z.infer<typeof ExtractionProposalSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type DecisionStatus = z.infer<typeof DecisionStatusEnum>;

// Valid values for suggestions
const VALID_CATEGORIES = ['dependency', 'version', 'constraint', 'architecture', 'decision', 'ownership', 'expertise', 'bug', 'tech_debt', 'rule', 'status'];
const VALID_ENTITY_TYPES = ['projects', 'libraries', 'patterns'];
const VALID_STATUSES = ['active', 'superseded'];

/**
 * Find closest match for a string in an array of valid values
 */
function didYouMean(input: string, validValues: string[]): string | null {
  const lowerInput = input.toLowerCase();
  
  // Exact match (case insensitive)
  const exact = validValues.find(v => v.toLowerCase() === lowerInput);
  if (exact) return exact;
  
  // Starts with match
  const startsWith = validValues.find(v => v.toLowerCase().startsWith(lowerInput));
  if (startsWith) return startsWith;
  
  // Contains match
  const contains = validValues.find(v => v.toLowerCase().includes(lowerInput));
  if (contains) return contains;
  
  return null;
}

/**
 * Get suggestion message for common mistakes
 */
function getSuggestion(path: (string | number)[], value: unknown): string | null {
  const fieldName = path[path.length - 1];
  
  if (fieldName === 'category' && typeof value === 'string') {
    const suggestion = didYouMean(value, VALID_CATEGORIES);
    if (suggestion) return `Did you mean '${suggestion}'?`;
  }
  
  if (fieldName === 'entityType' && typeof value === 'string') {
    const suggestion = didYouMean(value, VALID_ENTITY_TYPES);
    if (suggestion) return `Did you mean '${suggestion}'?`;
    return `Available entity types: ${VALID_ENTITY_TYPES.join(', ')}`;
  }
  
  if (fieldName === 'status' && typeof value === 'string') {
    const suggestion = didYouMean(value, VALID_STATUSES);
    if (suggestion) return `Did you mean '${suggestion}'?`;
  }
  
  return null;
}

export interface ValidationError {
  path: string;
  field: string;
  factIndex?: number;
  received: unknown;
  message: string;
  suggestion?: string;
  allowedValues?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function formatPath(path: (string | number)[]): string {
  return path.map(p => typeof p === 'number' ? `[${p}]` : `.${p}`).join('').replace(/^\./, '');
}

/**
 * Enhanced validation with detailed error information and suggestions
 */
export function validateExtractionProposalsDetailed(data: unknown): ValidationResult {
  const result = ExtractionProposalsSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  const errors: ValidationError[] = result.error.issues.map(issue => {
    const path = formatPath(issue.path);
    const field = String(issue.path[issue.path.length - 1]);
    const factIndex = issue.path[0] !== undefined && typeof issue.path[0] === 'number' ? issue.path[0] : undefined;
    
    // Get the actual value that failed validation
    let received: unknown = undefined;
    if (Array.isArray(data) && factIndex !== undefined) {
      const fact = data[factIndex];
      if (fact && typeof fact === 'object') {
        received = (fact as Record<string, unknown>)[field];
      }
    }
    
    const error: ValidationError = {
      path,
      field,
      factIndex,
      received,
      message: issue.message,
    };
    
    // Add suggestion
    const suggestion = getSuggestion(issue.path, received);
    if (suggestion) {
      error.suggestion = suggestion;
    }
    
    // Add allowed values for enums
    if (issue.message.includes('Invalid enum value')) {
      if (field === 'category') error.allowedValues = VALID_CATEGORIES;
      if (field === 'entityType') error.allowedValues = VALID_ENTITY_TYPES;
      if (field === 'status') error.allowedValues = VALID_STATUSES;
    }
    
    return error;
  });
  
  return { valid: false, errors };
}

export function validateFacts(data: unknown): { valid: boolean; errors: string[] } {
  const result = FactItemsArraySchema.safeParse(data);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}

export function validateExtractionProposals(data: unknown): { valid: boolean; errors: string[] } {
  const detailed = validateExtractionProposalsDetailed(data);
  if (detailed.valid) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: detailed.errors.map(e => {
      let msg = `Fact ${e.factIndex !== undefined ? e.factIndex : 'unknown'}.${e.field}: ${e.message}`;
      if (e.suggestion) msg += ` ${e.suggestion}`;
      if (e.allowedValues) msg += ` Allowed values: ${e.allowedValues.join(', ')}`;
      return msg;
    }),
  };
}
