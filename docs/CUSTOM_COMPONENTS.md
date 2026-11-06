# Самописные компоненты интерфейса AchieveTogether

> Каталог существующих React-компонентов и UI-обвязок в `one4sv/AT`. Подготовлен по исходникам актуального `main`. Это карта переиспользования, а не замена описания пропсов в TypeScript.
>
> **Перед созданием поля, списка, переключателя, модалки, меню, композера или загрузчика обязательно найти готовый компонент здесь и перечитать его исходник, связанные SCSS и пример использования.** Не заменять собственный компонент нативным элементом или новой реализацией только потому, что так быстрее. При реальной необходимости новой реализации объяснить отличие.

Смежные правила: [V0_6_FEATURES_AND_QA.md](V0_6_FEATURES_AND_QA.md), [CODE_STYLE.md](CODE_STYLE.md), [SCSS_GUIDE.md](SCSS_GUIDE.md), [CONTINUE.md](CONTINUE.md), [AGENTS.md](../AGENTS.md). Главные каталоги — `src/components/ts/`, `src/components/ts/utils/`, `src/components/modules/`, `src/components/hooks/`. Контейнеры конкретных страниц находятся в `src/pages/`.

## Быстрый выбор компонента

| Нужен элемент | Использовать | Исходник / стили |
| --- | --- | --- |
| Выпадающий список вариантов | **`SelectList`** | `src/components/ts/SelectList.tsx`, `src/scss/_mixins.scss` → `@mixin selectList` |
| Выбор ровно одного режима из нескольких строк | **`RadioGroup`** | `src/components/ts/RadioGroup.tsx`, `src/scss/radioGroup.scss` |
| Переключение вкладок с движущимся индикатором | **`Selector`** | `src/components/ts/Selector.tsx`, `src/scss/selector.scss` |
| Переключатель on/off | **`Toggler`** | `src/components/ts/Toggler.tsx`, `src/scss/toggler.scss` |
| Квадратный чекбокс | **`Checkbox`** | `src/components/ts/utils/Checkbox.tsx`, `src/scss/Checkbox.scss` |
| Выбор тега активности | **`TagSelector`** | `src/components/ts/TagSelector.tsx`, `src/components/ts/tags.ts` |
| Выбор дней недели | **`DayChanger`** | `src/components/ts/DayChanger.tsx` |
| Ввод календарной даты | **`CalendarInput`** | `src/components/ts/CalendarInput.tsx`; обёртка над `react-datepicker` |
| Заголовок календаря с месяцем и годом | **`DatePickerHeader`** | `src/components/ts/DatePickerHeader.tsx` |
| Автоувеличивающееся текстовое поле | **`TA`** / **`AutoDesc`** | `src/components/ts/TA.tsx` / `src/components/ts/utils/AutoDesc.tsx` |
| Полный ввод текста с файлами и emoji | **`Composer`** | `src/components/ts/Composer.tsx`, `src/scss/Composer.scss` |
| Кнопка/панель emoji | **`EmojiButton`**, **`EmojiBar`** | `src/components/ts/utils/EmojiButton.tsx`, `EmojiBar.tsx`, `src/scss/emojiBar.scss` |
| Превью прикреплённых файлов | **`MediaDraft`** | `src/components/ts/MediaDraft.tsx`, `src/scss/MediaDraft.scss` |
| Нижняя область страницы с возвратом | **`PageBottom`** | `src/components/ts/PageBottom.tsx`, `src/scss/PageBottom.scss` |
| Карточка чата в боковом меню | **`Contact`** | `src/components/ts/Contact.tsx`, `src/scss/SM/contactsList.scss` |
| Карточка активности | **`Habit`** | `src/components/ts/Habit.tsx` |
| Контекстное меню | **`ContextMenu`** + `useContextMenu` | `src/components/ts/ContextMenu/`, `src/components/context/ContextMenuContext.tsx` |
| Модальное окно | **`Blackout`** + зарегистрированный модуль | `src/components/ts/Blackout.tsx`, `src/components/modules/ModuleMap.ts` |
| Просмотр фотографии/галереи | **`ImgPrev`** + `useImagePreview` | `src/components/modules/ImgPrev.tsx`, `src/components/hooks/utils/useImagePreview.ts` |
| Подтверждение внешней ссылки | **`LinkConfirm`** + `useOpenLink` | `src/components/modules/LinkConfirm.tsx`, `src/components/hooks/utils/useOpenLink.ts` |
| QR аккаунта или приглашения в беседу | **`ShareAcc`** | `src/components/modules/ShareAcc.tsx`, `src/scss/modules/ShareAccDiv.scss` |
| Индикатор загрузки | **`Loader`**, **`LoaderSmall`**, **`MinLoader`** | `src/components/ts/Loader.tsx`, `LoaderSmall.tsx`, `MinLoader.tsx`, `src/scss/Loading.scss` |
| Скелетон загрузки | **`Skeleton`** | `src/components/ts/Skeleton.tsx`, `src/scss/Loading.scss` |
| Уведомление | **`Notification`** через `useNote` | `src/components/ts/Notification.tsx`, `src/components/context/NoteContext.tsx` |
| Подсветка текста поиска и ссылки | **`HighlightText`** | `src/components/ts/HighlightText.tsx` |
| Декоративная SVG-иллюстрация секции | **`SectionArt`** | `src/components/ts/SectionArt.tsx`, `src/scss/SectionArt.scss` |
| Сообщение о стадии разработки | **`BetaNotice`** / **`BetaArt`** | `src/components/ts/BetaNotice.tsx` / `BetaArt.tsx` |

## 1. Поля выбора и переключатели

### `SelectList` — свой выпадающий список (ПРИОРИТЕТ)

Файл: `src/components/ts/SelectList.tsx`. Примеры: `src/pages/HabitPage/components/HabitInfo/HabitSettings.tsx`, `src/components/modules/PermissionsSettings.tsx`. Стили **не встроены в компонент**: конкретный `className` должен оформляться через `@include var.selectList(...)` из `src/scss/_mixins.scss`, затем локально донастраиваться.

Реальные пропсы:
- `className: string` — обязательный CSS-класс, определяющий внешний вид;
- `arr: { label: string; value: string }[]` — варианты;
- `selected?: string | number` — выбранное значение; для корректного отображения должно совпадать с `arr[].value` (строкой);
- `onChange?: (value: string) => void` или `extraFunction?: (value: string) => void` — реакция на выбор;
- `prop?` — альтернативный setter состояния; не передавать одновременно несколько обработчиков без причины;
- `placeholder?`, `id?`, `chevron?`, `hide?`, `showSelected?`, `showOnly?`, `readOnly?`.

Пример:
```tsx
<SelectList
    className="redHabitSL"
    arr={[
        { label: "У каждого своё", value: "personal" },
        { label: "Общее для всех", value: "shared" }
    ]}
    selected={mode}
    onChange={setMode}
/>
```

**Особенности реализации:** `readOnly` управляет только редактируемостью текстового `input` и по умолчанию включён — это **не** запрет выбирать вариант. `showOnly` скрывает варианты и используется в существующем коде для режима только чтения. `hide` управляет закрытием при клике снаружи, `showSelected` — наличием текущего варианта в списке. Компонент сам хранит `showList` и `selectedLabel`; проверяйте, как он ведёт себя при изменении `selected` и при пустом значении. Для `Без роли` можно включать пункт с `value: ""`. Не добавлять рядом нативный `<select>`.

Оформление: найти стиль готового варианта `.redHabitSL` в `src/pages/HabitPage/scss/redHabit.scss`, `.rolesModalSelect` в `src/scss/modules/PermissionsDiv.scss` или другой подходящий вариант. Важно проверить `position`, `z-index`, `overflow` и границы прокручиваемой модалки: список не должен обрезаться или перекрывать соседние панели. Все обычные скругления — 24px; не задавать новый шрифт/`font-weight`.

### `RadioGroup`

Файл: `src/components/ts/RadioGroup.tsx`; стили: `src/scss/radioGroup.scss`. Выбор одного из режимов (например, видимость, доступ к совместной активности). Пропсы: `list` (элементы с `label`, `value` и необязательным `icon`), `val` (текущее значение), `newVal?` (обработчик), `disabled?`, обязательный `id` (используется как `data-setting-id`).

```tsx
<RadioGroup
    id="completion_mode"
    list={[
        { label: "У каждого своё", value: "personal" },
        { label: "Общее для всех", value: "shared" }
    ]}
    val={completionMode}
    disabled={saving}
    newVal={setCompletionMode}
/>
```

Не заменять нативными `<input type="radio">` или новым списком кнопок. Обратите внимание: в текущем коде `disabled` блокирует клики через CSS (`pointer-events: none`), а не через обработчик JS.

### `Selector`

Файл: `src/components/ts/Selector.tsx`; стили: `src/scss/selector.scss`. Горизонтальный переключатель с анимированным индикатором. Принимает `arr: { label, icon?, value, func }[]` и `selected`. Работает с `useSideMenu` и флагами `dontHandle` / `dontHandleOther`. Не переписывать управление касаниями: удержание 350 мс, перемещение, освобождение и отмена уже реализованы.

### `Toggler` и `Checkbox`

`Toggler`: `state`, `setState?`, `onToggle?`, `funcToggle?`, `disable?`, `stopPropagation?`. Для булевых настроек. `Checkbox`: `state`, `setState?`, `func?`, `funcNoVal?`, `disable?`. Для нескольких независимых выбранных значений.

**Важно:** если переключатель вложен в кликабельную строку, проверить всплытие события: не должно быть двойного переключения. Не добавлять другой switch, если можно использовать эти компоненты. Для семантики доступности в новом коде отдельно проверять клавиатуру и доступные названия, не считать `div` автоматически полноценным `button`.

### `TagSelector`, `DayChanger`, `CalendarInput`

`TagSelector`: `selectedTag`, `setSelectedTag`, `showOnly?`; список тегов уже определён в `src/components/ts/tags.ts`. `DayChanger`: `chosenDays`, `toggleDay`, `showOnly?`, `chosenArr?` — кнопки дней недели. `CalendarInput`: `value?: Date | null`, `onChange`, `maxDate?`, `minDate?`, `placeholder?`, `className?`, `id?`, `readOnly?`; обёртка использует `react-datepicker`, ввод даты — `ДД.ММ.ГГГГ`. `DatePickerHeader` — готовая навигация по месяцу/году в календаре.

## 2. Текст, файлы и emoji

- **`TA`** (`src/components/ts/TA.tsx`): автоизменение высоты текстового поля. Наследует обычные `textarea`-props, дополнительно `taRef?`, `onSend?`, `onFiles?`, `minHeight?` (по умолчанию 5 vh), `maxHeight?` (по умолчанию 50 vh). При `onSend` Enter отправляет, Shift+Enter создаёт новую строку; учитывается IME. `onFiles` обрабатывает файлы из буфера обмена. Использовать для ввода сообщений/комментариев вместо голого `textarea`, если нужен такой сценарий.
- **`AutoDesc`** (`src/components/ts/utils/AutoDesc.tsx`): компактное автоувеличивающееся поле описания. `value?`, `defaultValue?`, `onChange?`, `readOnly?`, `className?`. Не путать с `TA`.
- **`Composer`** (`src/components/ts/Composer.tsx`, `src/scss/Composer.scss`): готовая строка/панель написания текста. Обязательны `text`, `setText`, `files`, `setFiles`, `placeholder`, `onSend`, `sendLabel`. Также поддерживаются `media/setMedia`, `disabled`, `onBack`, `action`, `reply/onCancelReply` и `inlineAttach`. Содержит `TA`, отправку, вложения, emoji, drag/drop, предпросмотр. Для нового чата/комментариев/редактора сначала проверить, применим ли он.
- **`MediaDraft`** (`src/components/ts/MediaDraft.tsx`): `files`, `media?`, `onRemove(index)`, `disabled?`. Показывает вложения и умеет открывать изображения через `useImagePreview`. Для локальных файлов освобождает `URL.createObjectURL` при очистке.
- **`EmojiButton`** (`src/components/ts/utils/EmojiButton.tsx`): `taRef`, `open`, `setOpen`, `disabled?`. **`EmojiBar`** (`src/components/ts/utils/EmojiBar.tsx`): `taRef`, `setText`, `showEmojiBar`, `setShowEmojiBar`, `cn?`, `emojiPos?`, `emojiRef?`. Вставляет emoji в позицию курсора; учитывает мобильную клавиатуру и `visualViewport`. Не создавать ещё одну панель emoji.
- **`PageBottom`** (`src/components/ts/PageBottom.tsx`): `children?`, `innerRef?`, `onBack?`, `className?`. Нижняя область страницы; иконка возврата появляется при переданном `onBack`.
- **`HighlightText`** (`src/components/ts/HighlightText.tsx`): `text` и `search`. Подсвечивает совпадения, ссылки открывает через `useOpenLink` с подтверждением внешних адресов.

## 3. Контакты, активности и меню

- **`Contact`** (`src/components/ts/Contact.tsx`) — готовая **карточка чата** для бокового меню: принимает `contact`, отображает аватар, имя, последнее сообщение, статус прочтения/набора и действия. Это не универсальный пользовательский picker. Для поиска/выбора контактов в модалках также проверять `src/components/modules/HabitParticipantPicker.tsx`, `src/scss/modules/CreateChat.scss` и существующие `.createChatContact` / `.contactsUser.active`.
- **`Habit`** (`src/components/ts/Habit.tsx`) — карточка активности. Перед созданием похожей карточки проверить его пропсы и отображение `isMyAcc`, `id`, `onSelect` в реальных местах использования.
- **`SideMenu`** (`src/components/ts/SM/SideMenu.tsx`) и связанные `ContactsList`, `HabitsList`, `AccountList`, `SpotsList` — уже существующая система боковой навигации и горизонтальных жестов. Не создавать отдельную копию сайдбара.
- **`ContextMenu`** (`src/components/ts/ContextMenu/ContextMenu.tsx`) — единый рендерер контекстных меню. Открывается через `useContextMenu().openMenu(x, y, point, options, ...)`. Типы меню определены в `src/components/ts/ContextMenu/menus/` (активность, чат, пост, сообщение, участник, медиа и другие). `closeMenu()` закрывает его. `ContextMenuContext` устанавливает общий обработчик долгого нажатия для элементов с `data-context-menu`. Текущее удержание — 350 мс, отмена при движении больше 10 px. Сверять одинаковые действия для обычного клика, ПКМ и мобильного long-press.
- `src/components/ts/ContextMenu/MobileContextMenu.tsx` **сейчас пустой**. Не считать его готовой альтернативой основному меню.

## 4. Модалки, подтверждения, QR и просмотр изображений

**Единственная система модалок**: `Blackout` (`src/components/ts/Blackout.tsx`), `BlackoutContext`, `useBlackout` и регистрация в `src/components/modules/ModuleMap.ts`.

Пример открытия существующего модуля:

```tsx
const { setBlackout } = useBlackout();

setBlackout({
    seted: true,
    module: "ShareAcc",
    options: {
        nick: user.nick,
        url: user.avatar_url ?? undefined
    }
});
```

Закрытие: `setBlackout({ seted: false })`. `Blackout` уже управляет затемнением, стеком окон, кликом снаружи и мобильным свайпом. На мобильном `.mobileBar` рендерится оболочкой `.blackoutModule`, а **не** внутри компонента модалки. Не рисовать вторую полоску. Не добавлять в каждую модалку `×` или «Отмена» автоматически: ориентироваться на требование конкретного окна. В частности, в `PermissionsSettings` пользователь не хочет дополнительных кнопок закрытия; «Назад» предназначена только для внутреннего экрана.

Имеющиеся модули в `ModuleMap`:
- `ConfirmAction` — подтверждение действия с `blackout.confirmAction` (`title`, `description`, `label?`, асинхронная `run`);
- `Delete` / `DeleteConfirm` — существующие сценарии удаления;
- `ShareAcc` — общий QR аккаунта и приглашения в беседу. Для беседы передать в `options` готовую `link` и `url` аватара; не создавать второй QR;
- `ImgPrev` — полноэкранный просмотр изображений, галерея, навигация; предпочтительно вызывать через `useImagePreview(files)`;
- `LinkConfirm` — предпросмотр и подтверждение внешних ссылок; предпочтительно вызывать через `useOpenLink()`, который внутренние маршруты открывает напрямую;
- `PermissionsSettings` — **специальная** модалка «Права и роли»; файл `src/components/modules/PermissionsSettings.tsx`, стили `src/scss/modules/PermissionsDiv.scss`. Два экрана, сохранение настроек, **`SelectList` для выбора ролей**;
- `HabitParticipantPicker`, `HabitCollaborationSettings`, `HabitCreateChat`, `HabitDayActivityHistory`, `HabitTaskEditor` — готовые модалки совместной активности;
- `CreateChat`, `ChatWithInfo`, `Redirecting`, `RedirectMesses`, `PostSettings`, `AddHabit`, `Table` и остальные перечислены в `ModuleMap.ts`.

**Визуальный стандарт:** корень модалки использует `background: var(--mc)` и `backdrop-filter: blur(var(--blur))` с `-webkit-backdrop-filter`. Не ставить `var(--bgc)` на весь модальный контейнер: этот токен нужен для непрозрачного фона приложения или раскрывающегося списка, когда необходимо перекрыть текст за ним. На мобильном — полная ширина и без боковых зазоров. Подробно: [SCSS_GUIDE.md](SCSS_GUIDE.md#7-модалки-вложенность-слайдеры).

**Новая модалка:** сначала проверить существующую, затем использовать `Blackout`, добавить модуль в `ModuleMap` и локальный SCSS. Не создавать отдельный `position: fixed`-оверлей поверх `Blackout`. На мобильном: полная ширина, safe-area, скролл только у контента, нижние кнопки не должны уезжать за экран. Для слайдов: область просмотра `overflow: hidden`, панели имеют `flex: 0 0 100%`, сдвиг `translateX(-100%)`; не центрировать двойной контейнер через конфликтующий mixin/`transform`.

## 5. Загрузка, обратная связь, визуальные компоненты

- `Loader` — крупная загрузка, `LoaderSmall` и `MinLoader` — компактные; все используют существующие стили `Loading.scss`.
- `Skeleton` — `type?: "list" | "feed" | "habit" | "chat" | "profile"`, `count?` и `overview?`. Использовать для начальной загрузки списков/страниц вместо пустого состояния, которое может выглядеть как отсутствие данных.
- `Notification` вызывается через `useNote().showNotification(type, text)`; не писать новый toast для каждой формы. Проверять актуальный тип `useNote`.
- `SectionArt` — тематические SVG для разделов; `theme?` (варианты определены типом `ArtTheme`, включая уникальный `roadmap`), `section?`, `mini?`. Иллюстрация дорожной карты через `RoadmapArt` использует общую рамку, палитру и анимации `SectionArt`, а не собственные стили. `BetaNotice` и `BetaArt` — штатное предупреждение о ранней стадии разработки.
- `Header`, `Post`, `PageBottom`, `SideMenu` и компоненты конкретных страниц тоже самописные. Они **не обязательно универсальны**: перед переносом проверить состояние/контексты и все связанные CSS-классы.

## 6. Самописные хуки — часть контракта компонентов

Для модалки: `useBlackout`. Для уведомлений: `useNote`. Для контекстного меню: `useContextMenu`. Для внутренних и внешних ссылок: `useOpenLink`. Для изображений: `useImagePreview`. Для выбора режимов/боковой панели: `useSideMenu`. Для совместной активности: `useTheHabit`, `useGroup` и `useHabitMembers` (последний расположен рядом с `HabitInfo`). Для чатов и вложений: `useChat`, `useDrop`, `useMessages`.

Не делать самостоятельное состояние для данных, которые уже предоставляются соответствующим провайдером, если это создаст расхождение. Учитывать расположение провайдеров относительно `Routes` — параметры маршрутов, получаемые дочерними элементами, нельзя автоматически ожидать у глобального провайдера.

## 7. Стили, ограничения и порядок работы

1. Найти компонент в этом каталоге, открыть актуальный `.tsx` и все используемые `.scss` / миксины; проверить реальное использование в коде, включая `@media`.
2. Сначала переиспользовать компонент. Если нужна другая компоновка — передать `className` или добавить локальный вариант SCSS, а не копировать логику.
3. Использовать CSS-токены проекта (`--mc`, `--tc`, `--interact`, `--accent`, `--grad`, `--borderWh`, `--menuButtHover` и др.). Новые размеры геометрии — преимущественно `vw`/`dvh`, типовые скругления — **24px**.
4. **Не добавлять и не переопределять `font-weight`**. Не менять порядок импортов, структуру чужого JSX и стили за пределами задачи без необходимости.
5. Для `SelectList` помнить о `@mixin selectList(...)`, `z-index`, `overflow`, выпадающем списке и мобильной клавиатуре. Нативный `<select>` не подменяет готовый компонент.
6. Проверять доступность: `aria-label`, `focus-visible`, управление с клавиатуры, реальное поведение `disabled`. Не путать CSS-блокировку с серверной проверкой прав.
7. Проверять длительный текст, пустой список, загрузку и ошибку; на ПК и на мобильном — с открытым выпадающим списком, скроллом, свайпом и safe-area.
8. Изменения React/SCSS проверять через `npm run build`. После коммита проверить Vercel по новому SHA; для серверных API — Render. Не объявлять проверенным сценарий под пользователем, если его не тестировали.

## 8. Перед добавлением нового компонента

- Убедиться, что нужного уже нет в `src/components/ts`, `utils`, `modules` или компонентах страниц.
- Для новой переиспользуемой сущности определить интерфейс пропсов, место хранения состояния и существующую тему/SCSS.
- Если новый компонент действительно добавлен или изменён контракт старого, **обновить этот каталог в том же коммите**: путь, назначение, основные пропсы, стили, способ использования и ограничения.
- Компоненты из библиотек (например, сам `react-datepicker`, `@tiptap/react`, иконки Phosphor/Lucide) не считать самописными. Описывать **наши обёртки** над ними: `CalendarInput`, редактор постов, `SectionArt` и т. п.

Этот документ фиксирует состояние файлов, просмотренных при составлении. Перед рефакторингом источником истины остаётся текущий код `main`; если документ и код расходятся, проверить код и обновить документацию.

## 9. Рисованные иллюстрации и языковой слой

**Рисованные SVG**: `src/components/ts/SectionArt.tsx` — единая оболочка `SectionArt` и переключаемые сюжеты `Motif`. `src/scss/SectionArt.scss` определяет палитру, слои, миниатюры и анимации. `src/pages/Info/RoadmapArt.tsx` специально рендерит `<SectionArt theme="roadmap" mini/>` — не содержит собственной отдельной графической системы. Иллюстрацию для кнопки Info надо добавлять через `theme`/`section` и стандартный `.sectionArt--mini`, а не создавать второй SVG-фон или grid-правила.

**Язык**: `useTranslation("namespace")` из `react-i18next`; возможные namespaces `common`, `sign`, `info`, `settings`, `acc`. Значение меняется в `src/pages/Settings/Language.tsx`, сохраняется в `settings_lang` и используется через `SettingsContext`. `RoadmapText` — исключение для массива данных релизов; остальные JSX-строки не писать как `en ? "..." : "..."`.

**Info**: кнопки страниц формируются в `src/pages/Info/Info.tsx`, а содержимое — в `tabs`. Для новой страницы потребуется элемент `sections`, ключ в `tabs` и оба JSON `info.json`; маршрут `/info/:tab?` уже предусмотрен. В версии `dev 0.6.2` ссылка на `/info/roadmap`. В FAQ для контактов и roadmap использовать настоящие внутренние `Link`.

**Состояние**: `GroupInfo` и `AccInfo` используют одинаковую схему сворачивания, но соответствующее управление жестами находится у экранных контейнеров `Group.tsx`/`Acc.tsx`. Не пытаться исправить проблему только CSS-анимацией в дочернем компоненте.

**Права и даты**: `DoneContext` отвечает за состояние возможности выполнить день; реальная авторизация — в backend `getHabitAccess`. Для активности беседы `completion_start_date` определяется из `chat_members.joined_at`. Поэтому новая кнопка выполнения не должна обходить общую проверку.

Подробнее: [SVG_ART.md](SVG_ART.md), [I18N.md](I18N.md), [ARCHITECTURE.md](ARCHITECTURE.md), [COLLABORATION_AND_PERMISSIONS.md](COLLABORATION_AND_PERMISSIONS.md).

## Контекстные меню и фоновые модалки — конкретные стандарты

`useLongPressContextMenu` — общий обработчик обычных `data-context-menu` с `pointerdown/pointermove/pointerup`; удержание 350 мс открывает меню, отпускание на исходном элементе оставляет его, скольжение подсвечивает `ContextMenuButt.touchHover`. Хедеры используют отдельный `useHeaderMenuGestures` и связаны **только внутри хедера**. Не создавать изолированные реализации для `.settingButt`, `.contactsUser`, карточек и прочего.

`WallpaperStudio` (`/wallpapers`) — основная страница выбора обоев; `BackgroundLibrary` — совместимая модалка стандартных и пользовательских фонов (**до 5** загруженных в галерее); `BgHandler` — кадрирование 4 пропорций, масштаб и WebP перед загрузкой. Жесты: [SLIDERS.md](SLIDERS.md). `Blackout` не закрывает модалку во время внутренней прокрутки, пока список не был наверху в начале жеста. Внешняя поверхность модалки — `var(--mc)` с blur.

## Библиотека фонов и новые загрузочные состояния

`BackgroundLibrary` использует штатный `Selector` для двух вкладок «Стандартные / Мои фоны». Миниатюры `BackgroundLibrary` оформлены как `/wallpapers`: 5 колонок, на ПК 16:9, на телефоне 9:16, без видимых подписей и значков возможностей; используется общий `Background`, названия через `title`/`aria-label`. Кнопка добавления — SVG `ImagePlus` в отдельной плитке; галочка обозначает применённый фон, `ArrowsOutIcon` открывает полноэкранный просмотр. Модалка доступна по `SettingsSectionMenu` → контекстное меню «Интерфейс» → «Задний фон». Максимум 5 фонов.

`BackgroundEffectsSettings` находится в обычной `settingInnerDiv` раздела «Интерфейс» и использует штатный `SeekBar` (`barLine`), `Toggler` и переключатели фильтра.

В `BackgroundLibrary` до появления `settingsLoaded` рисуется skeleton-сетка, а для `img` до `onLoad` — `skeletonBlock`; в `QuickActionPicker` при загрузке контактов/активностей — строки `.skeletonCircle` + `.skeletonLine`, без преждевременного empty state. Анимация открытия не должна конкурировать со скроллом/жестом закрытия `Blackout`, на системном reduced-motion отключается.

Порядок разделов активности на iPhone меняется `pointerdown/move/up` за `ListIcon`, а не HTML `draggable`; активная строка и соседние плавно сдвигаются. Все изменённые функции сохраняют порядок в настройках.

## Selector внутри Blackout — запрет сквозных касаний

`src/components/ts/Selector.tsx` — **единственный** компонент переключения сегментов, включая `BackgroundLibrary`. Выбор работает на `pointerdown → pointermove → pointerup` с `setPointerCapture`, без задержки в 350 мс. Позиция индикатора может следовать пальцу, но значение отправляется только на `pointerup`. `pointercancel` откатывает индикатор, Enter/Space выбирает пункт с клавиатуры.

Селектор **не должен проверять `dontHandleOther` перед обработкой нажатия**: этот флаг может быть выставлен открытым SideMenu, из-за чего происходила потеря касаний. Сразу и всегда вызывать `stopPropagation` для touch/pointer событий, для `touchmove` — также `preventDefault` при `cancelable`. `touch-action: none` остаётся на `.selector`. При старте и завершении владения жестом `setDontHandle(true/false)`. Скролл `Blackout` и свайпы `MobileLayout` не должны получать этот жест. Не добавлять вторые `onTouchEnd` на каждый `.selectorElement`, иначе возникают двойные срабатывания.

## Переключение Selector в динамической модалке (iOS)

- Штатный `Selector` получает `pointerdown/move/up` сам и захватывает указатель; **`pointerup` не должен мгновенно заменять DOM-содержимое под указателем**. Иначе Safari может прислать поздний `click` уже в первую миниатюру вновь показанной вкладки.
- После `pointerup` переключение откладывается до завершения нативного click; селектор гасит `click` на себе и коротко блокирует отложенный доверенный click **только рядом с завершённым касанием**, чтобы тот не попал в новую плитку.
- `Blackout` не захватывает жест закрытия, начавшийся с `.selector`, кнопки, поля или `[role=button]`. Он закрывает окно по нажатию только на пустой overlay (`target === currentTarget`).
- `BackgroundLibrary` должна использовать неизменный штатный `Selector`; нельзя делать ещё один tab bar из кнопок с независимыми событиями.

## Стандартные фоны — палитра и паттерны

`BackgroundScene.tsx` — единственный рендерер стоковых сцен `art`, `aurora`, `nebula`, `sunset`. Все краски вычисляются из `--accent`, `--grad`, `--bgc`. Фиксированный seed создаёт псевдослучайные органические паттерны, которые совпадают между миниатюрой и реальным фоном. Не рисовать регулярные белые звёздные штрихи или случайные значения во время React render. Для `art` использовать существующие `SectionArt`.

Пункты «Приватность» в штатном `ContextMenuButt` ведут к существующим `data-setting-id` в `PrivacyTab`. В модалке пересылки `Redirecting` **нет** фильтра непрочитанных.

### dev 0.6.2 — статистика, палитры и интерактивные фоны

- **Schedule**: контейнер с фиксируемой полезной высотой `42dvh` (мобильный `48dvh`), `min-height:0` у flex-скроллеров дней и вложенная вертикальная прокрутка, чтобы блоки не обрезались в строку высотой несколько сантиметров. При архивном просмотре расписание остаётся видимым без возможности редактирования.
- **Статистика**: `OverallStats` — адаптивный dashboard: кольцо выполнения, ключевые числа, карточки стриков/перерывов, детальный график и счетчик/таймер только для подходящего типа активности. Внутри `mc` карточки используют `interact` без декоративного border, кроме внешнего слоя с фоном сайта. Не использовать `font-weight` в новых SCSS.
- **Собственные цвета**: общая модалка `CustomThemeColor` с двумя `input[type=color]`, двумя HEX-полями, предпросмотром градиента и единым сохранением. Значения хранятся в `localStorage` (`customAccentHex` / `customGradHex`) и включаются значениями темы `accent="custom"` / `grad="custom"`. `applyCustomPalette` применяет `--accent`, `--accent_text`, `--accent_op`, `--accent_hov`, `--inner_text`, `--grad`, `--grad_op` и др. Не затирать их при переключении темы; при выборе пресета удалять inline-переопределения.
- **10 дополнительных stock сцен**: `retroDrive` (закат и анимированная дорожная разметка без машины), `neonCity`, `paintSplash`, `liquid`, `prism`, `laser`, `waves`, `orbit`, `glitch`, `petals`. Все используют `--accent`, `--grad`, `--bgc` и псевдослучайные паттерны с фиксированным seed, совпадающие между карточкой и полноценным фоном. Стоковые сцены **не занимают** пять пользовательских слотов.
- **Скорость движения**: `BackgroundEffects.speed` в диапазоне 0–3, шаг 0.25, серверный `settings.bg_effects.speed`. `SeekBar` доступен на всех анимируемых фонах даже при выключенном движении, на статических **disabled**; 0× останавливает анимацию. Подпись настройки всегда без значения, единица `×` у самого SeekBar. `prefers-reduced-motion` отключает анимацию.
- **Пользовательские фоны**: в `BackgroundLibrary` никакие названия и повторяющиеся «Изменить фон» под своими миниатюрами не показывать; выбор по превью, удаление отдельно с `notValid`. У стандартных фонов подписи удалены, как в каталоге `/wallpapers`; доступны `title` и `aria-label`.
- **Roadmap**: текущая dev 0.6.2, 0.5 — только «Афродита», у каждой 0.5.x есть «Улучшение интерфейса», переименованы основные вехи. 0.6.1 переносится в историю, не теряя данные.

### 2026-11-04 — группы, движения и предпросмотр фоновых сцен

- Каталог стандартных фонов в `BackgroundLibrary` разделён на «Основные», «Атмосфера», «Ретро и неон», «Абстракция». Первый фон — «Акцентное свечение». Не смешивать их с вкладкой собственных фонов.
- Для контурных фигур `BackIconsScene` с фиксированным seed/нормализованными координатами используется как на странице, так и в обоих превью. У `BackgroundScene` эффекты размытия/свечения измеряются относительно контейнера в `cqw`, а не viewport: это сохраняет характер сцены в миниатюре.
- Полноэкранный фон и миниатюры используют общий `getBackgroundFilter`. Размер размытия в миниатюре масштабируется (0.24) пропорционально изображению; настройки контраста, насыщенности, сепии и других фильтров совпадают.
- «Неоновый город» переработан: геометрия skyline, светящиеся окна/луна, дорожная перспектива и анимированная разметка/подсветка; цвета из accent/grad/bgc.
- При выборе фона с поддержкой движения не менять `bg_effects.movement` автоматически: отдельный Toggler управляет этой настройкой. Speed SeekBar активен у таких фонов даже при выключенном переключателе движения; у статичных фонов остаётся disabled. RU/EN ключ `backgroundLibrary.speed` и заголовки групп обязательны.
- Для `prefers-reduced-motion: reduce` движение отключается. Проверить совпадение миниатюр на большом и узком экране, визуальный стиль neonCity, drag SeekBar, переключатель, сохранение после reload и работу при сетевой ошибке; не закрывать QA до проверки.

### 04.11.2026 — Schedule, статистика, пользовательские фоны и подтверждения

- У `.scheduleWrapper` **`overscroll-behavior-y: auto`**: после достижения верхней/нижней границы скролл колесом должен переходить в родительскую страницу. Не ставить `contain` в этом месте.
- Статистика: два flex-слайда по ширине `50%` внутри `200%` rail, класс `.toDetails` с `translate3d(-50%,0,0)`. Не измерять `wrapperWidth` и не менять `style.transform` непосредственно из touch-обработчика. При свайпе сначала определить направление: вертикальное движение прокручивает содержимое, горизонтальное переключает только статистику. `MobileLayout` не захватывает жесты внутри `.statsDivWrapper`.
- `statsFilter`: штатный `SelectList` с пунктами/hover в стиле ContextMenu (фон `--interact`, акцент `--accent_hov`, без оранжевой подложки и накладывающихся рамок). Popup должен быть выше графика и ограничивать высоту.
- У `.habitDayComment` на ПК в расфокусе `border: 1px solid var(--block_border)`; активная граница остаётся прежней, мобильная адаптация не меняется. `.contactsUser` и `.habit` в SM имеют `user-select: none`.
- `BgHandler`: одна crop-поверхность `react-easy-crop`, только масштаб с `SeekBar` в `×`, без настройки размытия и дублирующего img; одноразовый `URL.createObjectURL` обязательно освобождать через `URL.revokeObjectURL`. На мобильном — полноширинный нижний sheet с safe-area, корректными кнопками и `max-height`. При ошибке сохранения сообщать пользователю, не закрывая окно.
- `ConfirmAction` (удаление пользовательского фона) и `DeleteConfirm` — отдельные адаптивные модалки: 24px, `var(--mc)`, `var(--interact)`, `--notValid`, полный mobile sheet, перенос длинного текста без обрезки. Использовать системный `Blackout`, не создавать дополнительный overlay.
- `LineBar`/`SeekBar`: в текстовом заголовке **не печатать числовое значение**. Единицы только возле числа, которое сам ползунок показывает при перетаскивании/наведении: blur `px`, speed `×`. Скорость 0–3×, при 0 движение остановлено; `retroDrive` без машины.
- QA: пройти wheel над Schedule (вверх/вниз), статистические карточки → диаграммы → обратно, фильтры на ПК и iPhone, кадрирование фото, удаление фото, сообщения, safe-area, передачу жестов, сохранение 0× сервером. CI success не заменяет мобильный E2E.

### 2026-11-04 — полноэкранный просмотр фонов

- У каждой стандартной и пользовательской миниатюры справа нейтральная кнопка ArrowsOutIcon. У пользовательского фона кнопка удаления остаётся отдельной, левее просмотра.
- Выбор плитки и открытие просмотра — разные кнопки, запрещены вложенные button. Просмотр не сохраняет и не выбирает фон.
- BackgroundFullscreen зарегистрирован в ModuleMap и открывается поверх BackgroundLibrary через штатный Blackout. Передаёт options.id и при необходимости options.url.
- Используется тот же компонент Background с previewBg и previewUrl и те же bg_effects. В полном экране одна круглая ArrowsInIcon внизу по центру в PageBottom, для ПК и телефона, с safe-area.
- Появление и выход анимированы (scale, translate, opacity), Escape закрывает модалку. При prefers-reduced-motion анимации отключены. MobileBar и swipe-dismiss для просмотра отключены.
- QA: порядок окон/возврат в библиотеку, выбор vs просмотр, два рядом стоящих действия у пользовательских миниатюр, фильтры/скорость, iPhone Safari, клавиатура и reduced-motion.

### 04.11.2026 — предпросмотр фоновых сцен, паттерны, переключение движения

- В `BackgroundLibrary` выбор **не** включает `bg_effects.movement` автоматически. Движение включается/выключается только через отдельный `Toggler`; у статичных фонов он передаёт `disable={!supportsBackgroundMotion(bg)}`, визуально сереет, а `SeekBar` скорости тоже заблокирован. Никаких фоновых запросов `updatesettings` при простом выборе стандартного фона.
- Рядом с именем стандартного фона показываются компактные SVG-иконки возможностей с `title` на обёртке: `Film` — анимация доступна, `Palette` — цвета фона зависят от темы. Не ставить `title` прямо на Lucide-SVG (TypeScript не поддерживает этот prop).
- Для `color` сплошной фон **обязательно** рендерится внутренним `.backgroundCanvas` с `var(--bgc)` и эффектом `getBackgroundFilter`, иначе фильтр `invert` («Негатив») не работает.
- Контурные фигуры: `ContourPatternPicker` с двумя специально нарисованными SVG (сеткой «Порядок» и перекрывающимися фигурами «Хаос»). Настройка `settings_contour_pattern` использует `useLocalStorage`, включена в `APPEARANCE_KEYS` и доступна в `SettingsContext`. Два стабильных seeded набора в `BackIconsScene`: упорядоченный и хаотичный, пересекающийся. Превью и основной фон используют один паттерн.
- NeonCity: явно поднять `atNeonSkyline` над свечением/дорожной текстурой по `z-index`, сохранить различимость зданий и окон внизу и на высоких экранах.
- `BackgroundFullscreen`: единый `backgroundCatalog` для каталога и просмотра, стрелки на ПК, горизонтальный свайп на iPhone (как в `ImgPrev` через `framer-motion` `animate/useMotionValue`), подпись текущего фона внизу через `modulesenderInfo`, счётчик и список переключения по нажатию. В раскрываемой панели доступны фильтр, blur, movement, speed и паттерн, но **только в состоянии самого предпросмотра**. Ни `setBgEffects`, ни API `updatesettings` там вызывать нельзя; при выходе всё возвращается к сохранённым параметрам. Круглая кнопка закрытия остаётся снизу по центру в `PageBottom`.
- QA: проверить фильтр «Негатив» на сплошном фоне, неизменность movement при выборе, серый disabled toggler и slider, tooltip SVG, оба паттерна в разных темах, порядок слоёв неона, свайп/стрелки/keyboard на ПК/iPhone, список/настройки и отсутствие изменений настроек приложения после закрытия. Должны учитываться `prefers-reduced-motion`, безопасная область экрана и отсутствие двойного выбора фоновой плитки.

### 2026-11-05 — предпросмотр, SVG-паттерн, плавность LineBar и ретро-шоссе

- Выбор стандартных/личных фонов внутри `BackgroundFullscreen` — **отдельная вкладка** в штатном `Selector`, сетка на шесть элементов с пагинацией и кнопками назад/вперёд. Не делать бесконечный горизонтальный скролл миниатюр внутри общего вертикального скролла параметров. Во второй вкладке отображать только настройки предпросмотра.
- `PageBottom` у фуллскрина: круглая кнопка выхода слева, по центральной горизонтали — `modulesenderInfo` с акцентной шестерёнкой без обводки SVG, название фона и номер. Кнопки на одной вертикальной отметке на ПК и мобильных, учитывать `safe-area-inset-bottom`.
- Подсказки к SVG: `Palette` — «Зависит от цветов» (`themeAware`), отдельная `WandSparkles` у «Рисунков AchieveTogether» — «Зависит от оформления» (`appearanceAware`). `Film` отмечает наличие анимации, включая встроенное движение SVG в `art`. Не использовать неподдерживаемый `title` непосредственно на Lucide SVG, только на обёртке.
- Для «Контурных фигур» использовать **существующий** `Selector` с двумя собственными SVG (`OrderIcon` и `ChaosIcon`), а ниже — `SeekBar` размера фигур 0.5–1.5×, шаг 0.05. `settings_contour_size` хранить через `useLocalStorage` и `APPEARANCE_KEYS`; во фуллскрине `previewContourSize` меняется отдельно от сохранённого значения. Хаос: 44 фигуры, меньше размеры/непрозрачность и равномерная сетка со случайными отклонениями, без плотного скопления посередине.
- «Ретро-шоссе»: вертикальная дорожная разметка — повторяемый тайл **8dvh**, анимация `atRetroRoadScroll` двигает `background-position` на один точно такой же период. Начальный и конечный кадры должны совпадать без дырки/скачка.
- `SeekBar`: каждое значение округлять после квантования шага (4 знака в расчёте, без длинного «хвоста» при показе), `formatValue` отображает короткую форму. Полоса и точка плавно догоняют новое значение при перетаскивании; `prefers-reduced-motion` отключает переходы. По-прежнему не выводить числа в заголовке LineBar.
- `BgHandler` — `background: var(--mc)` у модалки и области кадрирования, без фона `--bgc`; сохранённые crop/zoom и адаптация iPhone не меняются.
- QA остаётся открытым до реального браузера: выбрать страницу 1/2/3 фоновой сетки, быстро пролистать и закрыть, проверить акцентную шестерёнку на iPhone, отредактировать фото с zoom=1.2×, бесшовный цикл шоссе и сохранение размера SVG, отсутствие изменений основных настроек от режима предпросмотра.

### 2026-11-05 — фоновые сцены, анимация и сворачиваемая библиотека

- Нижняя панель `BackgroundFullscreen` должна содержать две **рядом расположенные по центру** кнопки — круглую «Выйти» и `modulesenderInfo` с настройками/названием. Для обоих элементов устанавливать `pointer-events: auto`; у внешнего `PageBottom` они отключены, поэтому без переопределения плашка перестаёт нажиматься. Размеры и выравнивание проверять на ПК и iPhone.
- `supportsBackgroundMotion` разрешает движение только сценам с реальной управляемой CSS-анимацией. Для `landing`, `default`, `color`, пользовательских картинок и `sunset` переключатель и скорость **disabled**; искусственный `atBackgroundDrift` (zoom/pan) для неподвижных фонов не использовать. Переключение фонов не меняет состояние `movement`.
- В `art` у `SectionArt` есть собственные `artBob/artPulse/artSway/... ` keyframes, которые раньше работали даже при выключенном движении. Внутри `.atScene--art:not(.atScene--running)` явно отключать **все** CSS-анимации вложенных SVG через `animation: none !important`, не затрагивая независимые `SectionArt` на других страницах.
- У «Контурных фигур» паттерн `chaos` располагает 54 SVG в компактной сетке с лёгким перекрытием, небольшим jitter и слабой непрозрачностью. Размер — `settings_contour_size` через `useLocalStorage`.
- У «Рисунков AchieveTogether» отдельные, не общие с контурами настройки `settings_art_pattern` и `settings_art_size` через `useLocalStorage`; отображать общий `ContourPatternPicker` с параметром `subject="art"`. Оба режима и размер 0.5–1.5× должны работать в основной теме и в изолированном `BackgroundFullscreen` (`previewArtPattern` / `previewArtSize`), без записи в пользовательские настройки при предпросмотре.
- В `backgroundCatalog` «Рисунки AchieveTogether» находятся в «Основных». В `BackgroundLibrary` заголовки групп — кнопки с `aria-expanded` и сворачиваемым `hidden` содержимым; у SVG `LayoutGrid` в названиях контуров/рисунков `title` объясняет возможность настройки паттерна.
- Если в кнопке «Изменить фон» миниатюра «Акцентного свечения» становится чёрной, не использовать CSS shorthand `background: var(--bgc)` на `.bgManagePreview`: это затирает `background-image` класса `landingBackground`. Вместо него `background-color`.
- QA (ещё не E2E): переключить каждую категорию в свернутом/раскрытом состоянии, проверить движение off у art после перезагрузки, отключённый тумблер у статичных фонов, настройку обоих паттернов, отсутствие записи из полноэкранного предпросмотра, миниатюру accent glow, нижнюю панель и её кликабельность в Safari iPhone.

### 05.11.2026 — реальный хаос в фоновых SVG

- В `BackIconsScene` режим `order` сохраняет упорядоченную раскладку 54 иконок, а `chaos` создаёт **108 отдельных контурных SVG** с независимыми случайными `x/y` по всей площади, произвольными поворотами, разными размерами и невысокой прозрачностью. Для хаоса **нельзя** рассчитывать координаты от `row`/`column` даже со смещением: тогда снова возникает ровная сетка. Мягкое минимальное расстояние предотвращает отдельные чрезмерно плотные скопления, не выравнивая фигуры по рядам.
- В `BackgroundScene` режим `artPattern="order"` оставляет прежние четыре `SectionArt`. В `chaos` используются **8 разных иллюстраций**, случайно выбранных без повторов из всех 17 поддерживаемых `ArtTheme` (`SectionArt`); каждый экземпляр получает независимые `left/top/width/rotate`, их положение не привязано к фиксированным слотам. Сохраняются `artSize` и выключение внутренних анимаций через `atScene--art:not(.atScene--running)`.
- Случайный seed формируется **один раз при загрузке модуля**, а готовые позиции живут на уровне модуля. Поэтому переключение настроек и перерисовки React не двигают элементы хаотично каждый кадр, миниатюры и полноценный фон показывают **одинаковое** расположение. При следующей перезагрузке страницы композиция меняется.
- QA: «Хаос» должен явно отличаться от сетки на полном экране и в миниатюре, покрывать всю площадь без центрального скопления, контуров заметно больше, чем рисунков. На рисунках убедиться в разных темах `SectionArt` без повторов в одной композиции. Проверить оба режима, `artSize/contourSize`, movement off и reload на ПК/iPhone.

### 05.11.2026 — выбор фоновых сцен и физический carousel

- `BackgroundFullscreen`: трёхпозиционный движущийся трек для страниц по 6 миниатюр; `galleryPageFor(-1/0/1)`, `galleryX`, клики стрелок и pointer-swipe. Стрелки перелистывают весь каталог, включая пользовательские фотографии. Нельзя снова заменять переход `AnimatePresence mode="wait"` с fade между одной удалённой страницей и следующей.
- `BackgroundLibrary`: две одновременно смонтированные вкладки внутри `.backgroundLibrarySlidesTrack`, переключаются общим `Selector` и горизонтальным жестом; пользовательские фотографии, стандартные сцены, редактор, удаление и кнопки предпросмотра остаются раздельными обработчиками.


## Реестр слайдеров (сверка 06.11.2026)

См. [SLIDERS.md](SLIDERS.md) для SideMenu, Acc/Group, HabitMenu, календаря, статистики, Wallpaper Studio, совместимых BackgroundLibrary/BackgroundFullscreen, ImgPrev, Landing, Info/Settings, Selector, SeekBar и Schedule. Не смешивать бегунок значения с каруселью и вертикальным sheet.
