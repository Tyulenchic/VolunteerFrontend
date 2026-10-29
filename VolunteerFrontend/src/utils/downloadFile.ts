import axios from "axios";
import { apiClient } from "../api/client";

export type DossierFormat = "xlsx" | "docx" | "pdf";

export const DOSSIER_FORMATS: Array<{ key: DossierFormat; label: string; icon: string }> = [
  { key: "xlsx", label: "Excel", icon: "fa-file-excel" },
  { key: "pdf",  label: "PDF",   icon: "fa-file-pdf" },
  { key: "docx", label: "Word",  icon: "fa-file-word" },
];

/** Имя из Content-Disposition (если сервер его отдал и CORS его раскрыл); иначе запасное. */
function fileNameFrom(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (utf8) { try { return decodeURIComponent(utf8); } catch { /* берём запасное */ } }
  return /filename="?([^";]+)"?/i.exec(header)?.[1] ?? fallback;
}

/** При responseType:'blob' тело ошибки тоже Blob: превращаем его обратно в JSON, чтобы mapApiError видел { error }. */
async function unwrapBlobError(err: unknown): Promise<never> {
  if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
    try { err.response.data = JSON.parse(await err.response.data.text()); } catch { err.response.data = undefined; }
  }
  throw err;
}

/** Скачивает файл с авторизованного эндпоинта и отдаёт его браузеру как загрузку. */
export async function downloadFile(
  url: string, params: Record<string, string>, fallbackName: string, headers?: Record<string, string>,
): Promise<void> {
  const res = await apiClient
    .get<Blob>(url, { params, headers, responseType: "blob", timeout: 120_000 })
    .catch(unwrapBlobError);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(res.data);
  link.download = fileNameFrom(res.headers["content-disposition"], fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}
