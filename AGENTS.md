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

Важное ограничение текущей версии: публичный сайт пока не читает каталог из Payload CMS/PostgreSQL.

Сейчас публичные страницы используют импортированный каталог из `src/data/current-site.generated.ts`. Этот файл генерируется скриптом `npm run sync:current-site` из живого старого сайта `https://reko-med.ru` и не должен редактироваться вручную.

Payload CMS уже подключен:

- админка: `/admin`;
- REST API Payload: `/api/payload/...`;
- модели коллекций и global-настроек описаны в `src/lib/payload-collections.ts`;
- конфиг Payload находится в `src/payload.config.ts`.

Следующий крупный backend/CMS-этап: импортировать generated-данные в Payload, добавить слой чтения из CMS и переключить публичные шаблоны на Payload как источник данных. До этого изменения товаров в админке не появляются автоматически на публичной витрине.

## Технологии

- Next.js 16 App Router
- React 19
- TypeScript в strict-режиме
- Payload CMS 3
- PostgreSQL через `@payloadcms/db-postgres`
- Zod для валидации заявок
- Nodemailer для email-доставки заявок
- Telegram Bot API через `fetch`
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
npm run sync:current-site
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
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` - Telegram-доставка заявок;
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `LEADS_EMAIL_TO`, `LEADS_EMAIL_FROM` - email-доставка заявок.

Не выводить и не переносить реальные секреты из `.env` в ответы, логи, документацию или коммиты.

## Карта проекта

```text
src/
  app/
    [[...slug]]/page.tsx                    публичный catch-all route
    (payload)/admin/[[...segments]]/page.tsx Payload admin
    (payload)/api/payload/[...slug]/route.ts Payload REST API
    api/health/route.ts                     healthcheck
    api/leads/route.ts                      API приема заявок
    layout.tsx                              общий layout, JSON-LD Organization/WebSite
    globals.css                             дизайн-система и responsive CSS
    robots.ts                               robots.txt
    sitemap.ts                              sitemap.xml
    not-found.tsx                           404
  components/
    SiteChrome.tsx                          шапка, футер, нижний CTA
    MobileNav.tsx                           мобильное меню
    LeadForm.tsx                            клиентская форма заявок
    templates.tsx                           шаблоны публичных страниц
    JsonLd.tsx                              безопасный вывод JSON-LD
  data/
    current-site.generated.ts               импорт старого сайта, не редактировать вручную
  lib/
    content.ts                              маршрутизация, контент, направления, навигация
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

Главный публичный route: `src/app/[[...slug]]/page.tsx`.

Поток рендера:

1. `generateStaticParams()` собирает legacy URL из `currentSitePages`, посадочные направления, `/catalog/` и `/documents/`.
2. `getRoutePage()` из `src/lib/content.ts` нормализует slug и определяет тип страницы.
3. `getMetaForRoute()` строит metadata и canonical.
4. `templates.tsx` выбирает нужный шаблон.
5. `JsonLd` добавляет `BreadcrumbList`, а для товара еще `Product`.

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

`POST /api/leads` принимает JSON или form-data, валидирует через Zod, проверяет honeypot `companyWebsite`, применяет in-memory rate limit по IP, сохраняет заявку в `var/<LEADS_STORAGE_FILENAME>`, затем через `Promise.allSettled` пробует отправить ее в Telegram и email.

Файл локального хранения заявок находится в `var`, эта директория игнорируется git.

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

CMS-модель уже содержит поля для SEO, legacy path, товаров, категорий, документов и заявок. Но frontend пока берет данные не из CMS, а из generated-файла.

При изменении схемы Payload проверять:

- `src/lib/payload-collections.ts`;
- `src/payload.config.ts`;
- `payload-types.ts`, если типы регенерируются;
- публичный слой чтения данных, когда он будет добавлен.

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

## SEO

SEO-слой находится в:

- `src/app/layout.tsx`;
- `src/app/[[...slug]]/page.tsx`;
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
- volume `lead_storage` для `/app/var`.

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
- Для заявки падение Telegram или SMTP не должно ломать успешное локальное сохранение.
- Для Payload/Postgres не убирать `serverExternalPackages` из `next.config.ts` без проверки `npm run build`.

## Хорошие следующие задачи

Приоритетный roadmap:

1. Написать seed/import: `current-site.generated.ts` -> Payload collections.
2. Создать read-service, например `src/lib/cms-content.ts`, с fallback на generated-файл.
3. Переключить `getRoutePage`, sitemap и публичные шаблоны на CMS-данные.
4. Добавить проверку: товар, созданный в `/admin`, появляется на публичной странице.
5. Улучшить каталог: поиск, фильтры по характеристикам, бренды, документы к товарам.
6. Подключить `site-settings` к шапке, футеру и CTA.
7. Добавить тесты/acceptance checks для заявок, sitemap и ключевых legacy URL.

