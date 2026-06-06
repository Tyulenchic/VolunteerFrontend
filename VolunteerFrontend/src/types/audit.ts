// Audit Log DTO types

export interface AuditLogEntryDto {
  id: string;
  adminName: string;
  actionType: string;
  createdAt: string;
  ipAddress?: string;
  details: string;
}

