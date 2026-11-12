# Архитектура AchieveTogether

Краткая карта кода для новых разработчиков и агентов. Перед изменениями сверять структуру с текущей веткой `main`. Репозитории: [клиент](https://github.com/one4sv/AT) и [сервер](https://github.com/one4sv/achievetogether-server).

## Стек и запуск

- Клиент: React 19, TypeScript, Vite 7, React Router, SCSS/Sass, Motion, Axios; редактор на Tiptap 3; графики Chart.js; i18next.
- `npm ci`, `npm run dev` — локальный запуск; `npm run build` запускает `tsc -b && vite build`; `npm run lint` — ESLint. Для Vite env локальные значения не коммитить.
- `src/main.tsx` предварительно импортирует `theme-init.ts` и `i18n/i18n.ts`, затем `App`.
- `src/App.tsx` содержит Router, `AppProvider`, глобальные UI (`Blackout`, `Notification`, `ContextMenu`), маршруты.
- `src/components/ts/AppProvider.tsx` — вложенный граф контекстов. Смотрите реальный порядок: глобальный провайдер находится **выше** `Routes`, поэтому `useParams` внутри него может не иметь текущих параметров. `DoneContext` использует `useMatch`.
- API клиента: `src/components/ts/api.ts` создаёт Axios `baseURL: "/api/"` с `withCredentials: true`. Не отправлять запросы на случайный альтернативный URL; сопоставлять запросы с backend routes.
- Сервер: Node.js/Express, Supabase, realtime/WebSocket. Серверная авторизация и проверка разрешений обязательны для мутаций.

## Карта клиентских каталогов

| Папка | Назначение |
| --- | --- |
| `src/pages/` | Экранные контейнеры: Main, Chat, Acc, Group, HabitPage, Post, Info, Settings, Landing |
| `src/components/ts/` | Общие визуальные компоненты: `TA`, `Composer`, `SelectList`, `Blackout`, `SectionArt`, `PageBottom` |
| `src/components/ts/utils/` | Утилиты и простые UI-элементы |
| `src/components/modules/` | Содержимое модалок и `ModuleMap.ts` |
| `src/components/context/` | Контексты состояния, запросов, действий |
| `src/components/hooks/` | Удобные `useX`-обёртки над контекстами и независимые хуки |
| `src/components/layout/` | Адаптивная компоновка `ResponsiveLayout` |
| `src/scss/` | Глобальные токены, темы, миксины и общие стили |
| `src/pages/*/scss/` | Стили конкретных экранов; SCSS не хранить рядом с TSX |
| `src/components/modules/scss/`, `src/components/ts/scss/` | Стили модалок и общих компонентов в отдельных каталогах |
| `src/pages/Settings/components/SettingsTabs/` | Только компоненты вкладок настроек; вспомогательные компоненты — на уровень выше, в `Settings/components/`, стили — в `Settings/scss/` |
| `src/i18n/` | Настройка i18next и RU/EN JSON |
| `src/pages/Info/` | Info, FAQ, about, roadmap, отдельные данные релизов и рисованные SVG |

## Реальные маршруты

В `App.tsx`: `/` — Main; `/sign` — landing; `/post/new`, `/post/:postId/edit`, `/post/:postId`; `/habit`, `/habit/:habitId`; `/chat/:nick`, `/chat/g/:id`; `/acc/:nick`, `/acc`; `/room/:id`; `/join/:token`; `/settings/:tab?`, `/settings/language`, `/info/:tab?`; отдельный QR-маршрут авторизации. `/info/roadmap` — вкладка Info, не отдельный роут верхнего уровня.

## Передача данных и состояния

1. В `SettingsContext` живут тема, акцент, декор, язык и выбор/эффекты фона через `useLocalStorage` (без облачного сохранения параметров фона); `UpdateSettingsContext` отвечает за их изменение; `theme-init.ts` подставляет CSS-атрибуты до React.
2. В `HabitsContext` список доступных активностей, `TheHabitContext` — конкретная активность/состояние таймера и счётчика, `CalendarContext` — календарь, `DoneContext` — отправка отметок; `GroupContext` — данные беседы и права.
3. `SideMenuContext` арбитрирует мобильные жесты; меню/свайп/слайдер/сворачивание не должны конкурировать. Режим `settings_layout` относится только к ПК. Все слайдеры и их источники — [SLIDERS.md](SLIDERS.md); выбор фоновых изображений — [WALLPAPERS.md](WALLPAPERS.md).
4. `BlackoutContext` и `ModuleMap` управляют модалками. Внутренний `PermissionsSettings` не создаёт второй оверлей.
5. `ChatContext`, `MessagesContext`, `WebSocketContext`, `SendMessContext` отвечают за работу переписки и realtime. Для добавления события сначала разобраться с существующей синхронизацией.
6. Для внешних ссылок и медиа применять `useOpenLink` и `useImagePreview`; для уведомлений `useNote`.

## Источники истины и права

- React `disabled` или скрытая кнопка — UX, не безопасность. Источник прав: backend, Supabase/SQL RPC.
- Для активности серверная `utils/habitAccess.js` вычисляет `can_view`, `can_complete`, `can_comment`, `can_edit_blocks`, `can_edit_info`, `can_invite`, пользователя персонального/общего прогресса.
- Для привязанной к чату активности `chat_members.joined_at` определяет **раннюю допустимую дату** отметки участника. В сервере проверяют ручное выполнение, задачи и таймер; владелец исключён из ограничения.
- Для беседы роль `owner` (приоритет 100) системная и защищённая. Разрешения сохраняются и проверяются сервером; см. [COLLABORATION_AND_PERMISSIONS.md](COLLABORATION_AND_PERMISSIONS.md).
- Опасные изменения схемы выполнять только после чтения SQL/RPC и миграций; никогда не запускать старую миграцию наугад.

## Тема, визуальные правила и локализация

См. [SCSS_GUIDE.md](SCSS_GUIDE.md), [CUSTOM_COMPONENTS.md](CUSTOM_COMPONENTS.md), [SVG_ART.md](SVG_ART.md), [I18N.md](I18N.md). SCSS-геометрия преимущественно `vw/dvh`, радиусы 24px, CSS-токены темы. **Не добавлять `font-weight`**. Сохранить структуру JSX/порядок импортов. Рисованные иллюстрации — система `SectionArt`, языки — i18next.

## Работа с функциональностью

Любая правка данных совместной активности затрагивает как минимум: API сервера, соответствующий контекст/хук, отображение календаря, права доступа, статистику и UI. Перед коммитом проверить обе модели `personal/shared`, состояние владельца и приглашённого, mobile desktop, прошлое/сегодня/будущее, дату вступления, смену прав, обработку ошибок и realtime.


## Web Push

Клиент: `src/components/ts/utils/webPush.ts`, `NotificationsTab.tsx`, общий `public/at-wallpaper-cache-sw.js`, `manifest.webmanifest` и `PushInstallHelp`. Сервер: `routes/settings/push.js`, `services/push.js`, `utils/webPush.js`; состояние устройств — `public.at_push_subscriptions` с закрытым RLS. См. [WEB_PUSH.md](WEB_PUSH.md). Не регистрировать второй root-scope SW.

## Версии, редактор и ответственность модулей

- Редактор публикаций `PostEditor`, `PostToolbar`, `PostMediaNode` использует существующие Tiptap-компоненты, редактор текста — общие `TA`/`AutoDesc` без ручного `resize`. Не создавать второй `Composer` или `Blackout` для решения локальной задачи.
- Для проверки заявленных функций опираться на соответствующий модуль и его профильный MD; [CHANGELOG.md](CHANGELOG.md) — только краткая история, без технических предписаний.
