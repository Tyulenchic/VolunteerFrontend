import { apiClient } from './client';
import { appendCrop } from './images';
import { downloadFile } from '../utils/downloadFile';
import type { ImageCropDto } from '../types/organization';
import type {
  BookletDetailsDto, BookletDto, BookletDuplicates, BookletImportReport, BookletPage, BookletPerson, BookletRequestDetailsDto,
  BookletRequestPage, BookletRequestStatus, BookletState,
} from '../types/booklet';

const ADMIN = '/api/admin/booklets';

export interface BookletRequestForm {
  lastName: string;
  firstName: string;
  middleName?: string;
  birthYear: number;
  phone: string;
  comment?: string;
  /** Фото титульного листа: необязательно; кадр — вертикальный, как на бумажной книжке. */
  photo?: File | null;
  crop?: ImageCropDto | null;
}

/** Книжка со стороны волонтёра: что показать в профиле и форма для получения бумажной книжки. */
export const bookletApi = {
  state: async (): Promise<BookletState> => (await apiClient.get<BookletState>('/api/booklet')).data,

  submit: async (form: BookletRequestForm): Promise<BookletState['request']> => {
    const body = new FormData();
    body.append('lastName', form.lastName);
    body.append('firstName', form.firstName);
    if (form.middleName) body.append('middleName', form.middleName);
    body.append('birthYear', String(form.birthYear));
    body.append('phone', form.phone);
    if (form.comment) body.append('comment', form.comment);
    if (form.photo) {
      body.append('file', form.photo);
      appendCrop(body, form.crop);
    }
    const { data } = await apiClient.post<BookletState['request']>('/api/booklet/request', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return data;
  },
};

/** Книжки для администратора: заявки, выданные книжки, PDF, CSV и дубли. */
export const bookletAdminApi = {
  requests: async (status: BookletRequestStatus | '', skip: number, take: number): Promise<BookletRequestPage> =>
    (await apiClient.get<BookletRequestPage>(`${ADMIN}/requests`, { params: { skip, take, ...(status && { status }) } })).data,

  request: async (id: string): Promise<BookletRequestDetailsDto> =>
    (await apiClient.get<BookletRequestDetailsDto>(`${ADMIN}/requests/${id}`)).data,

  /** Номер необязателен: без него сервер берёт подходящий (V-00 и прежний id аккаунта, если свободен). */
  issue: async (id: string, number: string | null, issuedAt: string | null): Promise<BookletDto> =>
    (await apiClient.post<BookletDto>(`${ADMIN}/requests/${id}/issue`, { number: number || null, issuedAt: issuedAt || null })).data,

  reject: async (id: string, note: string): Promise<void> => { await apiClient.post(`${ADMIN}/requests/${id}/reject`, { note: note || null }); },

  search: async (q: string, withoutAccount: boolean | null, skip: number, take: number): Promise<BookletPage> =>
    (await apiClient.get<BookletPage>(ADMIN, { params: { skip, take, ...(q.trim() && { q: q.trim() }), ...(withoutAccount !== null && { withoutAccount }) } })).data,

  get: async (id: string): Promise<BookletDetailsDto> => (await apiClient.get<BookletDetailsDto>(`${ADMIN}/${id}`)).data,

  ofUser: async (userId: string): Promise<BookletDto | null> =>
    (await apiClient.get<{ booklet: BookletDto | null }>(`${ADMIN}/by-user/${userId}`)).data.booklet,

  create: async (person: BookletPerson & { number?: string | null; userId?: string | null }): Promise<BookletDto> =>
    (await apiClient.post<BookletDto>(ADMIN, { ...person, number: person.number || null, userId: person.userId || null })).data,

  update: async (id: string, person: BookletPerson): Promise<BookletDto> => (await apiClient.put<BookletDto>(`${ADMIN}/${id}`, person)).data,

  /** Только системный администратор. */
  changeNumber: async (id: string, number: string): Promise<BookletDto> =>
    (await apiClient.put<BookletDto>(`${ADMIN}/${id}/number`, { number })).data,

  /** null — снять книжку с аккаунта. */
  reassign: async (id: string, userId: string | null): Promise<BookletDto> =>
    (await apiClient.put<BookletDto>(`${ADMIN}/${id}/account`, { userId })).data,

  duplicates: async (): Promise<BookletDuplicates> => (await apiClient.get<BookletDuplicates>(`${ADMIN}/duplicates`)).data,

  /** Скачивает CSV со всеми книжками. */
  exportCsv: (): Promise<void> => downloadFile(`${ADMIN}/export`, {}, 'booklets.csv'),

  /** Проверка файла без записи (dryRun) или загрузка; в ответе — что исправлено и что не прошло. */
  importCsv: async (file: File, dryRun: boolean): Promise<BookletImportReport> => {
    const body = new FormData();
    body.append('file', file);
    body.append('dryRun', String(dryRun));
    const { data } = await apiClient.post<BookletImportReport>(`${ADMIN}/import`, body, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 });
    return data;
  },

  /** Скачивает PDF титульного листа. */
  downloadPdf: (id: string, label: string): Promise<void> => downloadFile(`${ADMIN}/${id}/pdf`, {}, `booklet-${label}.pdf`),

  /** Открывает PDF в новой вкладке, чтобы сразу отправить на печать. */
  async openPdf(id: string): Promise<void> {
    const tab = window.open('', '_blank');
    try {
      const { data } = await apiClient.get<Blob>(`${ADMIN}/${id}/pdf`, { responseType: 'blob', timeout: 120_000 });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (e) {
      tab?.close();
      throw e;
    }
  },
};
