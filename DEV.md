# DEV.md

Инженерная документация по проекту RekoMed. Документ нужен разработчику, который будет запускать проект локально, дорабатывать фронт, backend/API, Payload CMS, SEO, импорт каталога и деплой.

## 1. Кратко О Проекте

Проект находится в `F:\repos\work\rekomed`.

Это новая версия сайта `reko-med.ru`: B2B-сайт поставщика медицинских изделий для клиник, врачей, закупщиков и юрлиц. В первой реализации сайт сохраняет старые URL текущего каталога и добавляет новую продающую структуру: направления, категории, товары, заявки, SEO-разметку и подготовленную Payload CMS.

Текущий важный статус:

- публичная витрина читает товары, категории и бренды из Payload CMS/PostgreSQL через `src/lib/cms-content.ts`;
- `src/data/current-site.generated.ts` остается fallback-источником и legacy-слоем для старых URL;
- generated-файл создаётся скриптом `npm run sync:current-site` из текущего публичного сайта `https://reko-med.ru`;
- публичный catch-all route рендерится динамически, чтобы изменения из админки появлялись без пересборки проекта.

## 2. Технологии И Зависимости

Основной стек:

- Next.js 16 App Router
- React 19
- TypeScript
- Payload CMS 3
- PostgreSQL через `@payloadcms/db-postgres`
- VK Messages API через `fetch` для отправки заявок Борису
- JivoChat widget через CMS-настройку
- Zod для валидации заявок
- Lucide React для иконок
- Docker / Docker Compose для production-сборки
- nginx как reverse proxy

Основные npm scripts:

```bash
npm install
npm run dev
npm run build
npm run start
npm run typecheck
npm run payload:migrate
npm run payload:migrate:create
npm run payload:generate-importmap
npm run payload:generate-types
npm run sync:current-site
npm run import:current-site
npm run import:current-site-media
npm run audit:urls
```

Проверенные команды:

```bash
npm run typecheck
npm run build
npm run audit:urls
npm audit --audit-level=high
```

На момент передачи `npm audit --audit-level=high` проходит без high severity. Остаются moderate-уязвимости в транзитивном дереве Payload/Next/Drizzle/Monaco; не чинить через `npm audit fix --force` без проверки, потому что npm предлагает breaking downgrade/замены.

## 3. Структура Проекта

```text
.
├── src/
│   ├── app/
│   │   ├── (site)/layout.tsx
│   │   ├── (site)/[[...slug]]/page.tsx
│   │   ├── (site)/not-found.tsx
│   │   ├── (payload)/layout.tsx
│   │   ├── (payload)/admin/importMap.js
│   │   ├── (payload)/admin/[[...segments]]/page.tsx
│   │   ├── (payload)/api/payload/[...slug]/route.ts
│   │   ├── api/health/route.ts
│   │   ├── api/leads/route.ts
│   │   ├── globals.css
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── LeadForm.tsx
│   │   ├── JivoChatWidget.tsx
│   │   ├── MobileNav.tsx
│   │   ├── SiteChrome.tsx
│   │   ├── JsonLd.tsx
│   │   └── templates.tsx
│   ├── data/
│   │   └── current-site.generated.ts
│   ├── lib/
│   │   ├── content.ts
│   │   ├── leads.ts
│   │   ├── payload-collections.ts
│   │   ├── site-settings.ts
│   │   └── schema.ts
│   └── payload.config.ts
├── scripts/
│   ├── sync-current-site.mjs
│   └── audit-urls.mjs
├── deploy/
│   ├── nginx.conf
│   └── backup-postgres.sh
├── public/
│   └── og-rekomed.svg
├── Dockerfile
├── docker-compose.yml
├── next.config.ts
├── package.json
├── package-lock.json
├── payload-types.ts
├── README.md
└── DEV.md
```

## 4. Где Фронт

Публичный фронт лежит в:

- `src/app/(site)/[[...slug]]/page.tsx` — единый catch-all роутер публичных страниц.
- `src/components/templates.tsx` — шаблоны главной, направления, каталога, категории, товара, бренда, документов и инфостраниц.
- `src/components/SiteChrome.tsx` — шапка, футер, общий CTA-блок.
- `src/components/MobileNav.tsx` — мобильное меню.
- `src/components/LeadForm.tsx` — клиентская форма заявки.
- `src/app/globals.css` — вся текущая дизайн-система и адаптив.

Главная идея фронта:

- `(site)/[[...slug]]/page.tsx` получает slug;
- `getPublicContent()` и `getRoutePage()` из `src/lib/cms-content.ts` получают CMS+fallback данные и определяют тип страницы;
- нужный шаблон из `templates.tsx` рендерит страницу;
- SEO metadata генерируется через `generateMetadata`;
- JSON-LD добавляется через `JsonLd`.

Типы публичных страниц:

- `home`
- `direction`
- `catalog`
- `category`
- `product`
- `brand`
- `documents`
- `company`
- `help`
- `contacts`
- `page`

## 5. Где Backend

Backend-части находятся в `src/app/api` и `src/lib`.

### Заявки

- API: `src/app/api/leads/route.ts`
- бизнес-логика: `src/lib/leads.ts`
- клиентская форма: `src/components/LeadForm.tsx`

`POST /api/leads` принимает:

```ts
{
  type: 'callback'
  name: string
  phone: string
  email?: string
  message?: string
  pageUrl?: string
  productId?: string
  productTitle?: string
  productSku?: string
  productPath?: string
  productCategory?: string
  consent: true
  utm?: Record<string, string>
}
```

Что делает API:

- валидирует данные через Zod;
- проверяет honeypot `companyWebsite`;
- ограничивает частоту заявок по IP;
- сохраняет заявку в Payload collection `leads`;
- если заявка отправлена со страницы товара, сохраняет название, артикул, категорию и ссылку на товар;
- отправляет заявку в VK Борису через `messages.send`, если в `.env` есть `VK_GROUP_TOKEN`, а в `Site Settings` включён `vkLeadEnabled` и заполнен `vkRecipientPeerId`;
- если VK недоступен, заявка остаётся в CMS, а ошибка пишется в поля `deliveryStatus`/`deliveryError`;
- если CMS временно недоступна, пишет аварийную копию в `var/leads.jsonl` и возвращает ошибку формы.

### Healthcheck

- API: `src/app/api/health/route.ts`
- URL: `/api/health`

Используется для проверки, что приложение живо.

## 6. Где Payload CMS

Payload config:

- `src/payload.config.ts`

Payload collections/globals:

- `src/lib/payload-collections.ts`

Payload routes:

- `/admin` — админка
- `/api/payload/...` — Payload REST API

Next route-файлы:

- `src/app/(payload)/admin/[[...segments]]/page.tsx`
- `src/app/(payload)/api/payload/[...slug]/route.ts`

Коллекции:

- `users` — пользователи админки
- `media` — файлы и изображения
- `directions` — направления
- `categories` — категории
- `products` — товары
- `brands` — бренды
- `documents` — документы
- `articles` — статьи/новости
- `leads` — заявки

Global:

- `site-settings` — контакты, тексты формы, JivoChat, VK-доставка заявок и основной CTA

Публичный сайт читает товары, категории и бренды из Payload через `src/lib/cms-content.ts`. `src/data/current-site.generated.ts` используется как fallback и legacy-слой, чтобы старые URL продолжали работать даже при временной недоступности PostgreSQL.

## 7. Данные Каталога И URL

Сгенерированный каталог:

- `src/data/current-site.generated.ts`

Он содержит:

- `currentSiteGeneratedAt`
- `currentSiteStats`
- `skippedCurrentSiteUrls`
- `currentSitePages`

Скрипт импорта:

```bash
npm run sync:current-site
```

Что делает:

- читает `https://reko-med.ru/sitemap.xml`;
- обходит child-sitemaps;
- скачивает страницы;
- извлекает title, description, H1, тип страницы, legacy path, товарные характеристики, изображения;
- пишет `src/data/current-site.generated.ts`.

Скрипт аудита:

```bash
npm run audit:urls
```

Импорт generated-каталога в Payload:

```bash
npm run import:current-site -- --prune
```

Скрипт читает `src/data/current-site.generated.ts`, подключается к Payload REST API (`PAYLOAD_API_URL`, по умолчанию `http://localhost:3000/api/payload`) и авторизуется через `PAYLOAD_IMPORT_EMAIL` / `PAYLOAD_IMPORT_PASSWORD` или локальные тестовые данные. Он upsert-ит категории, бренды и товары, сохраняет legacy URL, старые ID, SEO title/description и характеристики, а также проставляет связи товар → категория и товар → бренд. Флаг `--prune` удаляет заглушки и записи, которых больше нет в generated-источнике.

Импорт изображений в Payload Media:

```bash
npm run import:current-site-media
```

Скрипт скачивает image URL из generated-файла, загружает файлы в Payload `Media`, затем проставляет `products.image` и `brands.logo`. После этого публичный сайт использует локальные `/api/payload/media/file/...` и не зависит от `/upload` старого сайта.

Он показывает количество живых URL и список URL из sitemap, которые старый сайт уже отдаёт как 404.

Последний импорт:

- 187 живых страниц;
- 144 товара;
- 24 категории;
- 9 брендов;
- 11 URL из sitemap старого сайта уже отдают 404.

## 8. SEO-Слой

SEO-файлы:

- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/lib/schema.ts`
- `src/app/(site)/[[...slug]]/page.tsx`
- `src/app/(site)/layout.tsx`
- `public/og-rekomed.svg`

Реализовано:

- canonical URL;
- unique title/description на основе типа страницы;
- Open Graph;
- JSON-LD `Organization`;
- JSON-LD `WebSite`;
- JSON-LD `BreadcrumbList`;
- JSON-LD `Product` для товарных страниц;
- sitemap по legacy URL и новым посадочным страницам;
- robots без старого ошибочного `Host: https://mi36.ru`.

При добавлении новых публичных страниц нужно проверить:

- есть ли route в `getRoutePage`;
- есть ли metadata в `getMetaForRoute`;
- попала ли страница в `sitemap.ts`;
- нужен ли JSON-LD;
- не ломается ли canonical.

## 9. Env-Переменные

Пример находится в `.env.example`.

Минимум для dev:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgres://rekomed:change-me@localhost:5432/rekomed
PAYLOAD_SECRET=local-secret-change-me
```

Для заявок:

```env
LEADS_STORAGE_FILENAME=leads.jsonl
LEAD_RATE_LIMIT_PER_HOUR=12

VK_GROUP_TOKEN=
VK_API_VERSION=5.199
```

Что важно:

- `NEXT_PUBLIC_SITE_URL` влияет на canonical, sitemap и schema.
- `DATABASE_URL` нужен для Payload CMS.
- `PAYLOAD_SECRET` обязателен для production.
- `VK_GROUP_TOKEN` нужен для отправки заявок через VK-сообщество.
- `LEADS_STORAGE_FILENAME` задаёт имя fallback-файла внутри папки `var`.
- `Jivo Widget ID`, `Vk Lead Enabled`, `Vk Recipient Peer ID`, тексты формы и контакты меняются в Payload `Site Settings`.

## 10. Локальная Разработка

Первый запуск:

```bash
cd /d F:\repos\work\rekomed
npm install
copy .env.example .env
npm run dev
```

Сайт:

```text
http://localhost:3000/
```

Админка:

```text
http://localhost:3000/admin
```

API:

```text
http://localhost:3000/api/health
http://localhost:3000/api/leads
http://localhost:3000/api/payload/...
```

Перед сдачей изменений:

```bash
npm run typecheck
npm run build
npm run audit:urls
npm audit --audit-level=high
```

Если нужен Payload локально, поднимите PostgreSQL. Самый простой путь:

```bash
docker compose up -d postgres
npm run dev
```

После этого открыть `/admin`. Если пользователей ещё нет, Payload покажет экран создания первого пользователя.

## 11. Production И Деплой

Файлы деплоя:

- `Dockerfile`
- `docker-compose.yml`
- `deploy/nginx.conf`
- `deploy/backup-postgres.sh`

Production-запуск:

```bash
docker compose up -d --build
```

При старте production-контейнер выполняет `payload migrate`, поэтому на чистой PostgreSQL сначала создаются таблицы Payload, а затем запускается `node server.js`. После изменения коллекций Payload нужно создать новую миграцию:

```bash
npm run payload:migrate:create
```

Миграции лежат в `src/migrations` и должны попадать в Docker-образ.

Payload uploads сохраняются в `/app/media`, который смонтирован как `media_storage` volume. Named volume может быть создан Docker-ом от `root`, поэтому `Dockerfile` использует entrypoint: создает `/app/var` и `/app/media`, делает `chown -R nextjs:nodejs`, затем запускает приложение через `su-exec` от пользователя `nextjs`. Если на старом образе загрузка падает с `EACCES: permission denied, open 'media/...'`, нужно пересобрать образ или разово поправить владельца `/app/media` внутри контейнера.

Payload admin использует отдельный root layout в `src/app/(payload)/layout.tsx`. После изменения кастомных admin components или richtext features нужно регенерировать import map:

```bash
npm run payload:generate-importmap
```

Проверки после деплоя:

```bash
curl -I https://reko-med.ru/
curl https://reko-med.ru/api/health
curl https://reko-med.ru/robots.txt
curl https://reko-med.ru/sitemap.xml
```

nginx:

- пример лежит в `deploy/nginx.conf`;
- домен `www.reko-med.ru` редиректится на `https://reko-med.ru`;
- приложение проксируется на `127.0.0.1:3000`;
- SSL ожидается через Let's Encrypt.

Бэкапы PostgreSQL:

```bash
deploy/backup-postgres.sh
```

Скрипт делает `pg_dump`, gzip-архив и удаляет бэкапы старше 14 дней.

## 12. Как Добавлять Фичи

### Новый публичный блок на главной

1. Открыть `src/components/templates.tsx`.
2. Найти `HomePage`.
3. Добавить новый section-компонент или вынести отдельную функцию.
4. Стили добавить в `src/app/globals.css`.
5. Проверить mobile layout на 390px.
6. Прогнать `npm run typecheck` и `npm run build`.

### Новая посадочная страница направления

1. Добавить объект в `directions` внутри `src/lib/content.ts`.
2. Указать `slug`, `title`, `summary`, `oldSections`, `highlights`, `cta`.
3. Убедиться, что страница открывается по `/{slug}/`.
4. Проверить, что она попала в `generateStaticParams` и `sitemap.ts`; это уже происходит автоматически через массив `directions`.

### Новый тип публичной страницы

1. Добавить тип в `getRoutePage` внутри `src/lib/content.ts`.
2. Добавить metadata в `getMetaForRoute`.
3. Добавить шаблон в `src/components/templates.tsx`.
4. Подключить шаблон в `src/app/(site)/[[...slug]]/page.tsx`.
5. При необходимости добавить JSON-LD.

### Новое поле товара

Для generated-режима:

1. Изменить парсер в `scripts/sync-current-site.mjs`.
2. Перегенерировать данные через `npm run sync:current-site`.
3. Обновить шаблон `ProductPage` / `ProductCard` в `templates.tsx`.

Для CMS-режима:

1. Изменить коллекцию `Products` в `src/lib/payload-collections.ts`.
2. Обновить `payload-types.ts`, если используется генерация типов Payload.
3. Обновить публичный query-слой после подключения Payload как источника данных.

### Новая интеграция заявок

1. Добавить переменные в `.env.example`.
2. Добавить функцию доставки в `src/lib/leads.ts`.
3. Вызвать её в `src/app/api/leads/route.ts`.
4. Сделать `Promise.allSettled`, чтобы падение одной доставки не ломало всю заявку.
5. Добавить логирование ошибок без вывода секретов.

## 13. Переход На CMS Как Источник Данных

Рекомендуемый следующий этап:

1. Написать seed/import script: `current-site.generated.ts` -> Payload collections.
2. Создать категории, товары, бренды и документы в PostgreSQL.
3. Добавить acceptance test: товар, созданный в `/admin`, появляется на публичной странице.
4. Улучшить каталог: поиск, фильтры, привязанные документы, бренды и понятные страницы пустых категорий.
5. Проверить, что `sitemap.ts` строится из CMS и содержит все старые URL после импорта.

`src/lib/cms-content.ts` уже читает Payload CMS и оставляет fallback на generated-файл для аварийного режима.

## 14. Траблшутинг

### `/admin` не открывается

Проверьте:

- заполнен ли `DATABASE_URL`;
- запущен ли PostgreSQL;
- заполнен ли `PAYLOAD_SECRET`;
- нет ли ошибок в терминале `npm run dev`.

### Заявки не приходят в VK

Проверьте:

- `VK_GROUP_TOKEN` в `.env`;
- `Vk Lead Enabled` в `Site Settings`;
- `Vk Recipient Peer ID` в `Site Settings`;
- Борис разрешил сообщения от VK-сообщества или доступен по указанному `peer_id`;
- в заявке в CMS поля `deliveryStatus` и `deliveryError`.

Даже если VK недоступен, заявка должна сохраняться в Payload collection `leads`.

### JivoChat не появился на сайте

Проверьте:

- `Jivo Enabled` в `Site Settings`;
- `Jivo Widget ID` в `Site Settings`;
- в поле указан только ID виджета, а не полный HTML/script-код.

### `next build` ругается на Payload/Postgres/Drizzle

Проверьте `next.config.ts`. Для Payload/Postgres уже выставлено:

```ts
serverExternalPackages: ['payload', '@payloadcms/db-postgres', '@payloadcms/drizzle', 'drizzle-kit', 'esbuild']
```

Это нужно, чтобы Turbopack не пытался бандлить server-only tooling.

### После `sync:current-site` изменился sitemap count

Это нормально: скрипт читает живой старый сайт. Если старый сайт изменился, generated-файл тоже изменится. Перед production-синхронизацией всегда смотрите diff и `npm run audit:urls`.

## 15. Правила Для Контента И Медицинских Формулировок

- Не обещать лечение, выздоровление или клинический результат.
- Писать про поставку, подбор, характеристики, документы и условия работы.
- Для товаров указывать проверяемые параметры: материал, размер, производитель, документы, наличие/под заказ.
- Для SEO не плодить пустые страницы без ассортимента или заявки.
- Для новых документов хранить источник и дату актуальности.
