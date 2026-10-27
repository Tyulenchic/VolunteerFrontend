// Однократный перенос справочника организаций из прежнего кода сайта в файл для импорта в БД.
//
// До перехода на API каталог организаций был зашит в src/pages/organizations/OrganizationsPage.tsx (массив ORGS).
// Скрипт читает этот массив из ИСТОРИИ git (файл в рабочей копии уже заменён страницей, работающей через API),
// переводит его в формат запроса POST /api/organizations и пишет scripts/organizations.seed.json.
//
// Запуск:  node scripts/export-organizations.mjs [путь-к-старому-OrganizationsPage.tsx]
// Без аргумента берёт файл из git: git show HEAD:./src/pages/organizations/OrganizationsPage.tsx
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const here = dirname(fileURLToPath(import.meta.url));

const source = process.argv[2]
  ? readFileSync(process.argv[2], 'utf8')
  : execFileSync('git', ['show', 'HEAD:./src/pages/organizations/OrganizationsPage.tsx'], { cwd: resolve(here, '..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// Берём только данные: от объявления типов до конца файла (там нет JSX и импортов).
const start = source.indexOf('export type OrgCategory');
if (start < 0) throw new Error('В файле не найден блок данных (export type OrgCategory ...).');
const js = ts.transpileModule(source.slice(start), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
// Данные — обычные литералы; исполняем их в изолированном контексте без доступа к Node.
const sandbox = { exports: {} };
vm.runInNewContext(js, sandbox, { timeout: 5000 });
const orgs = sandbox.exports.ORGS;
if (!Array.isArray(orgs) || orgs.length === 0) throw new Error('Массив ORGS не найден или пуст.');

const LEVEL = { school: 'School', college: 'College', university: 'University' };
const CATEGORY = { eco: 'Eco', social: 'Social', patriotic: 'Patriotic', cultural: 'Cultural', sport: 'Sport', zoo: 'Zoo', youth: 'Youth', health: 'Health' };
const DIRECTION = {
  'экологическ': 'Ecological', 'социальн': 'Social', 'гражданско-патриотическ': 'CivicPatriotic', 'патриотическ': 'Patriotic',
  'культурн': 'Cultural', 'спортивно-оздоровительн': 'SportHealth', 'спортивн': 'Sport', 'зооволонтер': 'Zoo', 'зооволонтёр': 'Zoo',
  'медицинск': 'Medical', 'благотворительн': 'Charity', 'образовательн': 'Educational', 'духовно': 'Spiritual', 'зож': 'HealthyLife',
  'событийн': 'Events', 'благоустройств': 'Improvement', 'просветительск': 'Enlightenment', 'агроволонтер': 'Agro', 'агроволонтёр': 'Agro',
  'инклюзивн': 'Inclusive', 'гуманитарн': 'Humanitarian',
};
const direction = (label) => {
  const key = Object.keys(DIRECTION).find((k) => label.toLowerCase().includes(k));
  return key ? DIRECTION[key] : null;
};

const out = orgs.map((o) => {
  const firstContact = o.movements.find((m) => m.phone || m.email);
  return {
    legacyId: o.id,
    name: o.name,
    shortName: o.shortName || null,
    description: o.description,
    city: o.city,
    level: LEVEL[o.level] ?? 'Other',
    categories: [...new Set((o.categories ?? []).map((c) => CATEGORY[c]).filter(Boolean))],
    contactPhone: firstContact?.phone ?? null,
    contactEmail: firstContact?.email ?? null,
    website: null,
    movements: (o.movements ?? []).map((m) => ({
      name: m.name,
      directions: [...new Set((m.directions ?? []).map(direction).filter(Boolean))],
      leaderName: m.leader,
      phone: m.phone ?? null,
      email: m.email ?? null,
    })),
  };
});

const target = resolve(here, 'organizations.seed.json');
writeFileSync(target, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Организаций: ${out.length}, движений: ${out.reduce((n, o) => n + o.movements.length, 0)} → ${target}`);
