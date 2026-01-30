import { z } from 'zod';

export const FactCategoryEnum = z.enum([
  'dependency', 'version', 'constraint', 'architecture', 'decision',
  'ownership', 'expertise', 'bug', 'tech_debt', 'rule', 'status',
]);

export const FactStatusEnum = z.enum(['active', 'superseded']);

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
});

export const FactItemsArraySchema = z.array(FactItemSchema);

export const ExtractionProposalSchema = z.object({
  entityType: z.enum(['projects', 'developers', 'libraries', 'patterns']),
  entityName: z.string().min(1),
  fact: z.string().min(1),
  category: FactCategoryEnum,
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.string().optional(),
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

export type FactItem = z.infer<typeof FactItemSchema>;
export type FactCategory = z.infer<typeof FactCategoryEnum>;
export type FactStatus = z.infer<typeof FactStatusEnum>;
export type ExtractionProposal = z.infer<typeof ExtractionProposalSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type DecisionStatus = z.infer<typeof DecisionStatusEnum>;

export function validateFacts(data: unknown): { valid: boolean; errors: string[] } {
  const result = FactItemsArraySchema.safeParse(data);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}

export function validateExtractionProposals(data: unknown): { valid: boolean; errors: string[] } {
  const result = ExtractionProposalsSchema.safeParse(data);
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}
