import * as fs from 'fs';
import * as path from 'path';
import { AuditEntry, AuditLogSchema } from './validation';
import { atomicWriteJSON } from './facts';

export function auditPath(metaRoot: string): string {
  return path.join(metaRoot, 'audit.json');
}

export function readAuditLog(metaRoot: string): AuditEntry[] {
  const p = auditPath(metaRoot);
  if (!fs.existsSync(p)) return [];
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const result = AuditLogSchema.safeParse(raw);
  if (!result.success) return [];
  return result.data;
}

export function appendAudit(metaRoot: string, entry: Omit<AuditEntry, 'timestamp'>): void {
  fs.mkdirSync(metaRoot, { recursive: true });
  const log = readAuditLog(metaRoot);
  const full: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  log.push(full);
  atomicWriteJSON(auditPath(metaRoot), log);
}
