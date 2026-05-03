# AGENTS.md

Инструкция для AI-агентов и разработчиков, которые продолжают работу над проектом RekoMed.

## Назначение проекта

RekoMed - новая версия сайта `https://reko-med.ru/`.

Это B2B-сайт поставщика медицинских изделий, расходных материалов и оборудования для клиник, врачей, закупочных отделов и юридических лиц. Проект решает сразу несколько задач:

- сохранить старые URL текущего каталога, чтобы не потерять поисковый индекс и внешние переходы;
- заменить старую витрину более понятной структурой: направления, категории, товары, документы, бренды, заявки;
- дать менеджерам и редакторам Payload CMS для будущего управления каталогом, документами, статьями, заявками и настройками;
- улучшить SEO-слой: canonical, sitemap, robots, metadata и JSON-LD;
- принимать заявки на КП, наличие, подбор, документы и обратный звонок.

## Текущий статус

Публичный сайт читает товары, категории и бренды из Payload CMS/PostgreSQL через `src/lib/cms-content.ts`.

Импортированный каталог `src/data/current-site.generated.ts` остается fallback-источником и legacy-слоем для старых URL. Этот файл генерируется скриптом `npm run sync:current-site` из живого старого сайта `https://reko-med.ru` и не должен редактироваться вручную.

Payload CMS уже подключен:

- админка: `/admin`;
- REST API Payload: `/api/payload/...`;
- модели коллекций и global-настроек описаны в `src/lib/payload-collections.ts`;
- конфиг Payload находится в `src/payload.config.ts`.

Товары, созданные в `Products`, появляются на публичном сайте по `Legacy Path` или `/catalog/{slug}/`. Если PostgreSQL временно недоступна, витрина показывает generated-каталог.

## Технологии

- Next.js 16 App Router
- React 19
- TypeScript в strict-режиме
- Payload CMS 3
- PostgreSQL через `@payloadcms/db-postgres`
- Zod для валидации заявок
- VK Messages API через `fetch` для доставки заявок Борису
- JivoChat widget, управляемый через `Site Settings`
- Lucide React для иконок
- Docker / Docker Compose для production
- nginx как reverse proxy

## Основные команды

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

Перед сдачей изменений обычно проверять:

```bash
npm run typecheck
npm run build
npm run audit:urls
```

`npm audit --audit-level=high` упоминается в `DEV.md` как полезная проверка. Не запускать `npm audit fix --force` без отдельного анализа: он может предложить breaking-изменения в дереве Payload/Next/Drizzle/Monaco.

## Переменные окружения

Пример лежит в `.env.example`.

Минимально важные переменные:

- `NEXT_PUBLIC_SITE_URL` - canonical, sitemap, schema;
- `DATABASE_URL` - подключение Payload к PostgreSQL;
- `PAYLOAD_SECRET` - секрет Payload, обязателен для production;
- `LEADS_STORAGE_FILENAME` - файл для локального хранения заявок внутри `var`;
- `LEAD_RATE_LIMIT_PER_HOUR` - лимит заявок на IP;
- `VK_GROUP_TOKEN` - секрет VK-сообщества для доставки заявок Борису;
- `VK_API_VERSION` - версия VK API, по умолчанию `5.199`.

Не выводить и не переносить реальные секреты из `.env` в ответы, логи, документацию или коммиты.

## Карта проекта

```text
src/
  app/
    (site)/layout.tsx                       публичный layout, JSON-LD, SiteChrome, Jivo
    (site)/[[...slug]]/page.tsx             публичный catch-all route
    (site)/not-found.tsx                    публичная 404
    (payload)/layout.tsx                    Payload RootLayout и provider
    (payload)/admin/importMap.js            сгенерированный Payload import map
    (payload)/admin/[[...segments]]/page.tsx Payload admin
    (payload)/api/payload/[...slug]/route.ts Payload REST API
    api/health/route.ts                     healthcheck
    api/leads/route.ts                      API приема заявок
    globals.css                             дизайн-система и responsive CSS
    robots.ts                               robots.txt
    sitemap.ts                              sitemap.xml
  components/
    SiteChrome.tsx                          шапка, футер, нижний CTA
    MobileNav.tsx                           мобильное меню
    LeadForm.tsx                            клиентская форма заявок
    templates.tsx                           шаблоны публичных страниц
    JsonLd.tsx                              безопасный вывод JSON-LD
  data/
    current-site.generated.ts               импорт старого сайта, не редактировать вручную
  lib/
    content.ts                              статический контент, направления, навигация
    cms-content.ts                          чтение каталога из Payload с fallback на generated
    leads.ts                                схема и доставка заявок
    payload-collections.ts                  коллекции Payload
    schema.ts                               JSON-LD схемы
scripts/
  sync-current-site.mjs                     импорт sitemap/страниц старого сайта
  audit-urls.mjs                            аудит generated-данных
deploy/
  nginx.conf                                пример nginx
  backup-postgres.sh                        backup PostgreSQL
```

Корневые документы:

- `README.md` - инструкция для пользователя админки;
- `DEV.md` - подробная инженерная документация;
- `AGENTS.md` - краткая рабочая память для будущих агентов.

## Публичный frontend

Главный публичный route: `src/app/(site)/[[...slug]]/page.tsx`.

Поток рендера:

1. `getPublicContent()` из `src/lib/cms-content.ts` читает Payload collections `products`, `categories`, `brands`.
2. Если CMS недоступна, `cms-content.ts` возвращает generated fallback из `src/data/current-site.generated.ts`.
3. `getRoutePage()` нормализует slug и определяет тип страницы по CMS+generated карте URL.
4. `getMetaForRoute()` строит metadata и canonical.
5. `templates.tsx` выбирает нужный шаблон.
6. `JsonLd` добавляет `BreadcrumbList`, а для товара еще `Product`.

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

Основные шаблоны лежат в `src/components/templates.tsx`: главная, направление, каталог, категория, товар, бренд, документы, информационная страница, блок доверия, процесс, блок документов.

## Заявки

Клиентская форма: `src/components/LeadForm.tsx`.

API: `src/app/api/leads/route.ts`.

Бизнес-логика и delivery: `src/lib/leads.ts`.

`POST /api/leads` принимает JSON или form-data, валидирует через Zod, проверяет honeypot `companyWebsite`, применяет in-memory rate limit по IP, сохраняет заявку в Payload collection `leads`, затем пробует отправить ее Борису в VK через `messages.send`. Если заявка пришла со страницы товара, в payload уходят название, артикул, категория и ссылка на товар.

Файл локального хранения заявок в `var` используется только как аварийный fallback, если CMS временно недоступна.

Типы заявок:

- `quote`
- `availability`
- `selection`
- `documents`
- `callback`

## Payload CMS

Коллекции:

- `users`
- `media`
- `directions`
- `categories`
- `products`
- `brands`
- `documents`
- `articles`
- `leads`

Global:

- `site-settings`

CMS-модель содержит поля для SEO, legacy path, товаров, категорий, документов и заявок. Frontend читает `products`, `categories` и `brands` через `src/lib/cms-content.ts`, а generated-файл использует как fallback.

При изменении схемы Payload проверять:

- `src/lib/payload-collections.ts`;
- `src/payload.config.ts`;
- `payload-types.ts`, если типы регенерируются;
- `src/lib/cms-content.ts`, если меняются поля товаров, категорий или брендов.

## Импорт старого каталога

`npm run sync:current-site`:

- читает `https://reko-med.ru/sitemap.xml`;
- обходит child-sitemaps;
- скачивает страницы;
- извлекает title, description, h1, тип страницы, section, id, изображение и часть характеристик;
- записывает `src/data/current-site.generated.ts`.

Текущая generated-статистика:

- всего 187 страниц;
- 144 товара;
- 24 категории;
- 9 брендов;
- также есть home, company, help, contacts и page;
- 11 URL из старого sitemap уже отдавали 404 на момент последней генерации.

После любого запуска `sync:current-site` проверять diff generated-файла и запускать `npm run audit:urls`.

`npm run import:current-site -- --prune`:

- читает `src/data/current-site.generated.ts`;
- авторизуется в Payload REST API через `PAYLOAD_IMPORT_EMAIL` / `PAYLOAD_IMPORT_PASSWORD` или локальные тестовые данные;
- создает/обновляет категории, бренды и товары в Payload;
- сохраняет legacy path, старый ID, SEO title/description, описание и характеристики;
- проставляет связи товар -> категория и товар -> бренд, если бренд найден в названии товара;
- с `--prune` удаляет тестовые/лишние товары, категории и бренды, которых нет в generated-источнике.

Для другого окружения можно задать `PAYLOAD_API_URL`, например `http://localhost:3000/api/payload`.

`npm run import:current-site-media`:

- читает image URL из `src/data/current-site.generated.ts`;
- скачивает изображения со старого сайта;
- загружает их в Payload `Media`;
- привязывает товарные картинки к `products.image`, а логотипы к `brands.logo`.

После успешного импорта публичная витрина использует локальные `/api/payload/media/file/...`, а не внешние `https://reko-med.ru/upload/...`.

## SEO

SEO-слой находится в:

- `src/app/(site)/layout.tsx`;
- `src/app/(site)/[[...slug]]/page.tsx`;
- `src/app/robots.ts`;
- `src/app/sitemap.ts`;
- `src/lib/schema.ts`;
- `public/og-rekomed.svg`.

Реализовано:

- canonical через `NEXT_PUBLIC_SITE_URL`;
- metadata на основе типа route;
- Open Graph;
- JSON-LD `Organization`;
- JSON-LD `WebSite`;
- JSON-LD `BreadcrumbList`;
- JSON-LD `Product`;
- sitemap из legacy URL и новых посадочных;
- robots с запретом `/admin/`, `/api/`, `/_next/`.

При добавлении публичной страницы проверить route, metadata, sitemap, canonical и необходимость JSON-LD.

## Дизайн и UI

Стили находятся в `src/app/globals.css`.

Текущий стиль: спокойный B2B-интерфейс для медицинского поставщика, без маркетинговой перегрузки. Цветовая база задается CSS-переменными в `:root`: светлый фон, белые поверхности, темный текст, teal-primary, зеленый accent и amber-акцент.

Ключевые UI-части:

- sticky header и topbar;
- desktop/mobile navigation;
- hero и page hero;
- grids для направлений, категорий и товаров;
- product cards;
- lead form;
- bottom CTA;
- footer.

При изменении UI обязательно проверять адаптив на ширинах около 390px, 720px и desktop. Текст в кнопках и карточках не должен вылезать из контейнеров.

## Content Rules

Тематика медицинская, поэтому формулировки должны быть осторожными:

- не обещать лечение, выздоровление или клинический результат;
- не писать "лечит", "гарантирует восстановление", "лучший метод лечения";
- писать про изделие, характеристики, документы, поставку, наличие, подбор и КП;
- для товаров указывать только проверяемые параметры;
- не создавать пустые SEO-страницы без полезного описания, ассортимента или CTA;
- документы проверять на актуальность.

В generated-файле могут быть старые медицинские формулировки. При ручной правке публичного текста придерживаться более строгих правил выше.

## Деплой

Файлы:

- `Dockerfile`;
- `docker-compose.yml`;
- `deploy/nginx.conf`;
- `deploy/backup-postgres.sh`.

Production-сборка использует `next.config.ts` с `output: 'standalone'` и `serverExternalPackages` для Payload/Postgres/Drizzle tooling.

Docker Compose поднимает:

- `postgres` на `postgres:16-alpine`;
- `app`, который слушает порт `3000`;
- volume для PostgreSQL;
- volume `lead_storage` для `/app/var`;
- volume `media_storage` для `/app/media`, куда Payload сохраняет изображения, PDF и другие uploads.

В `Dockerfile` entrypoint на старте создает `/app/var` и `/app/media`, выставляет владельца `nextjs:nodejs`, затем запускает приложение через `su-exec`. Это важно для named volumes: Docker может создать volume от root, и без runtime `chown` загрузка файлов в Payload падает с `EACCES: permission denied, open 'media/...'`.

Проверки после деплоя:

```bash
curl -I https://reko-med.ru/
curl https://reko-med.ru/api/health
curl https://reko-med.ru/robots.txt
curl https://reko-med.ru/sitemap.xml
```

## Важные осторожности

- В этой рабочей папке на момент осмотра не обнаружен `.git`-репозиторий. Не рассчитывать на `git status` как на защиту от перезаписи пользовательских изменений.
- Не редактировать `src/data/current-site.generated.ts` вручную. Менять скрипт импорта и регенерировать файл.
- Не коммитить `.env`, `var`, `.next`, `node_modules`, `payload-types.ts`, `*.tsbuildinfo`.
- Не выводить реальные секреты из `.env`.
- Не менять публичные legacy URL без явной причины: это важная часть SEO-миграции.
- Не подключать публичную витрину к CMS частично без fallback или проверки sitemap/legacy paths.
- Для заявки падение VK-доставки не должно ломать успешное сохранение в Payload CMS.
- Для Payload/Postgres не убирать `serverExternalPackages` из `next.config.ts` без проверки `npm run build`.
- После изменения Payload collections создавать миграцию через `npm run payload:migrate:create`; production Docker перед стартом выполняет `payload migrate`.
- После добавления/изменения Payload admin components или richtext features регенерировать `src/app/(payload)/admin/importMap.js` через `npm run payload:generate-importmap`.

## Хорошие следующие задачи

Приоритетный roadmap:

1. Написать seed/import: `current-site.generated.ts` -> Payload collections.
2. Улучшить каталог: поиск, фильтры по характеристикам, бренды, документы к товарам.
3. Добавить acceptance tests: товар, созданный в `/admin`, появляется на публичной странице.
4. Добавить полноценные публичные страницы документов и связей товар-документ.
5. Добавить тесты для заявок, sitemap и ключевых legacy URL.
