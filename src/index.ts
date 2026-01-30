// Public API
export { MemoryGraph } from './core/graph';
export { slugify, ENTITY_TYPES, EntityType, listEntities, createEntity } from './core/entity';
export { readFacts, writeFacts, getActiveFacts, atomicWriteJSON, atomicWriteText } from './core/facts';
export { appendAudit, readAuditLog } from './core/audit';
export {
  FactItem, FactCategory, FactStatus, ExtractionProposal, AuditEntry,
  FactItemSchema, FactItemsArraySchema, ExtractionProposalSchema,
  validateFacts, validateExtractionProposals,
} from './core/validation';

// Commands (for programmatic use)
export { initCommand } from './commands/init';
export { extractCommand } from './commands/extract';
export { synthesizeCommand } from './commands/synthesize';
export { viewCommand } from './commands/view';
export { searchCommand } from './commands/search';
export { verifyCommand } from './commands/verify';
export { statusCommand } from './commands/status';
export { exportCommand } from './commands/export';
export { importCommand } from './commands/import';
export { helpAgentCommand } from './commands/help-agent';
