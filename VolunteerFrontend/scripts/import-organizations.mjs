// Импорт справочника организаций (scripts/organizations.seed.json) в БД через API.
//
// Запускает администратор один раз после выкладки версии с организациями. Повторный запуск безопасен: организация
// с таким названием уже есть — пропускается (сервер отвечает 409).
//
// Учётные данные берутся из переменных окружения и нигде не выводятся:
//   API_URL         адрес API, например https://api.example.org
//   ADMIN_EMAIL     email администратора
//   ADMIN_PASSWORD  пароль администратора
//
// Запуск (PowerShell):
//   $env:API_URL='https://api.example.org'; $env:ADMIN_EMAIL='…'; $env:ADMIN_PASSWORD='…'
//   node scripts/import-organizations.mjs [--dry-run]
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes('--dry-run');
const orgs = JSON.parse(readFileSync(resolve(here, 'organizations.seed.json'), 'utf8'));

if (dryRun) {
  console.log(`Пробный запуск: будет создано организаций — ${orgs.length}, движений — ${orgs.reduce((n, o) => n + o.movements.length, 0)}.`);
  process.exit(0);
}

const base = (process.env.API_URL ?? '').replace(/\/+$/, '');
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!base || !email || !password) {
  console.error('Задайте API_URL, ADMIN_EMAIL и ADMIN_PASSWORD (см. комментарий в начале файла).');
  process.exit(1);
}

async function call(path, body, token) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* тело не JSON */ }
  return { status: response.status, data };
}

const login = await call('/api/auth/login', { email, password });
if (login.status !== 200 || !login.data?.accessToken) {
  console.error(`Не удалось войти (HTTP ${login.status}). Проверьте адрес и учётные данные.`);
  process.exit(1);
}
const token = login.data.accessToken;

let created = 0;
let skipped = 0;
let failed = 0;
for (const { legacyId, ...org } of orgs) {
  const result = await call('/api/organizations', org, token);
  if (result.status === 201) created++;
  else if (result.status === 409) skipped++;
  else {
    failed++;
    console.error(`× ${legacyId}: HTTP ${result.status} ${result.data?.error ?? ''}`.trim());
  }
}
console.log(`Готово: создано ${created}, уже было ${skipped}, ошибок ${failed}.`);
process.exit(failed ? 2 : 0);
