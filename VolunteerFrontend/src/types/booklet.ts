/** Добровольческая книжка: то, что приходит с сервера (BookletService). */

export type BookletRequestStatus = 'Pending' | 'Issued' | 'Rejected';

export interface BookletDto {
  id: string;
  number: number;
  /** Номер в стандартном виде: V-00414. */
  label: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  birthYear: number;
  /** Дата выдачи, ГГГГ-ММ-ДД. */
  issuedAt: string | null;
  hasPhoto: boolean;
  photoUrl: string | null;
  version: number;
  createdAt: string;
  updatedAt: string | null;
  /** Только администратору. */
  userId?: string | null;
  accountEmail?: string | null;
  accountName?: string | null;
  /** Аккаунт удалён: книжка хранит номер и данные и ждёт новый аккаунт этого человека. */
  accountDeleted?: boolean;
}

export interface BookletRequestDto {
  id: string;
  status: BookletRequestStatus;
  lastName: string;
  firstName: string;
  middleName: string | null;
  birthYear: number;
  phone: string;
  comment: string | null;
  hasPhoto: boolean;
  photoUrl: string | null;
  createdAt: string;
  handledAt: string | null;
  adminNote: string | null;
  bookletLabel: string | null;
  /** Только администратору. */
  userId?: string;
  accountEmail?: string;
  bookletId?: string | null;
}

export interface BookletState {
  booklet: BookletDto | null;
  request: BookletRequestDto | null;
  /** Форма открыта: книжки ещё нет, заявки нет (или прошлая заявка отклонена). */
  canRequest: boolean;
}

export interface BookletAccountRef { id: string; email: string; name: string }

export interface BookletRequestDetailsDto extends BookletRequestDto {
  sameBooklets: BookletDto[];
  sameAccounts: BookletAccountRef[];
  suggestedNumber: number;
  suggestedLabel: string;
}

export interface BookletDetailsDto extends BookletDto {
  sameBooklets: BookletDto[];
  freeAccounts: BookletAccountRef[];
}

export interface BookletRequestPage { items: BookletRequestDto[]; total: number; pending: number }
export interface BookletPage { items: BookletDto[]; total: number }

export interface BookletDuplicates {
  accounts: { id: string; email: string; name: string; bookletLabel: string | null }[][];
  orphans: (BookletDto & { candidates: BookletAccountRef[] })[];
}

export interface BookletImportLine { line: number; reason: string }
export interface BookletImportFix { line: number; field: string; from: string; to: string }

export interface BookletImportReport {
  dryRun: boolean;
  lines: number;
  created: number;
  skipped: BookletImportLine[];
  conflicts: BookletImportLine[];
  fixes: BookletImportFix[];
  errors: BookletImportLine[];
  notes: string[];
}

export interface BookletPerson {
  lastName: string;
  firstName: string;
  middleName?: string | null;
  birthYear: number;
  issuedAt?: string | null;
}
