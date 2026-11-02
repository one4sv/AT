export interface RoadmapText {
    ru: string;
    en: string;
}

export interface RoadmapRelease {
    version: string;
    title: RoadmapText;
    features: RoadmapText[];
}

export const roadmapHistory: RoadmapRelease[] = [
    {
        version: "0.0.1",
        title: { ru: "Страница регистрации", en: "Sign-in page" },
        features: [
            { ru: "Первый экран входа", en: "Initial sign-in screen" }
        ]
    },
    {
        version: "0.0.2",
        title: { ru: "Учётные записи", en: "Account context" },
        features: [
            { ru: "UserContext и подтверждение почты", en: "UserContext and email confirmation" }
        ]
    },
    {
        version: "0.0.3",
        title: { ru: "Главная страница", en: "Home page" },
        features: [
            { ru: "Первая версия главной страницы", en: "First home page" }
        ]
    },
    {
        version: "0.0.4",
        title: { ru: "Боковое меню", en: "Side menu" },
        features: [
            { ru: "Первая версия SideMenu", en: "First SideMenu" }
        ]
    },
    {
        version: "0.0.5",
        title: { ru: "Профиль", en: "Profile" },
        features: [
            { ru: "Страница аккаунта и редактирование профиля", en: "Account page and profile editing" }
        ]
    },
    {
        version: "0.1",
        title: { ru: "Foundation", en: "Foundation" },
        features: [
            { ru: "Основа приложения и навигации", en: "Core application and navigation" }
        ]
    },
    {
        version: "0.1.1",
        title: { ru: "Создание активности", en: "Create activity" },
        features: [
            { ru: "Добавление привычек", en: "Create habits" }
        ]
    },
    {
        version: "0.1.2",
        title: { ru: "Состояние активностей", en: "Activity state" },
        features: [
            { ru: "HabitContext", en: "HabitContext" }
        ]
    },
    {
        version: "0.1.3",
        title: { ru: "Страница привычки", en: "Habit page" },
        features: [
            { ru: "Активности в SideMenu", en: "Habits in SideMenu" },
            { ru: "Страница активности", en: "Habit page" }
        ]
    },
    {
        version: "0.2",
        title: { ru: "Привычки", en: "Habits" },
        features: [
            { ru: "Основные инструменты привычек", en: "Core habit tools" }
        ]
    },
    {
        version: "0.2.1",
        title: { ru: "Контакты и поиск", en: "Contacts and search" },
        features: [
            { ru: "Контакты в SideMenu", en: "Contacts in SideMenu" },
            { ru: "Поиск в SideMenu", en: "SideMenu search" }
        ]
    },
    {
        version: "0.2.2",
        title: { ru: "Страница чата", en: "Chat page" },
        features: [
            { ru: "Первые интерфейсы переписки", en: "Early messaging interface" }
        ]
    },
    {
        version: "0.2.3",
        title: { ru: "Обновление профиля", en: "Profile refresh" },
        features: [
            { ru: "Улучшения страницы аккаунта", en: "Account page improvements" }
        ]
    },
    {
        version: "0.2.4",
        title: { ru: "Сообщения", en: "Messaging" },
        features: [
            { ru: "WebSocket", en: "WebSocket" },
            { ru: "Отправка и отображение сообщений", en: "Message sending and display" }
        ]
    },
    {
        version: "0.3",
        title: { ru: "Связь", en: "Connections" },
        features: [
            { ru: "Личные диалоги", en: "Direct conversations" }
        ]
    },
    {
        version: "0.3.1",
        title: { ru: "Главная и публикации", en: "Home and publishing" },
        features: [
            { ru: "Текстовое поле для публикаций", en: "Post text input" }
        ]
    },
    {
        version: "0.3.2",
        title: { ru: "Посты профиля", en: "Profile posts" },
        features: [
            { ru: "Публикации пользователя", en: "User posts" }
        ]
    },
    {
        version: "0.3.3",
        title: { ru: "Лента контактов", en: "Contacts feed" },
        features: [
            { ru: "Публикации контактов на главной", en: "Contacts' posts on home" }
        ]
    },
    {
        version: "0.3.4",
        title: { ru: "Реакции", en: "Reactions" },
        features: [
            { ru: "Лайки и комментарии к постам", en: "Post likes and comments" }
        ]
    },
    {
        version: "0.3.5",
        title: { ru: "Календарь", en: "Calendar" },
        features: [
            { ru: "Календарь активности", en: "Activity calendar" }
        ]
    },
    {
        version: "0.3.6",
        title: { ru: "Прогресс", en: "Progress" },
        features: [
            { ru: "Стрики", en: "Streaks" },
            { ru: "Комментарии к активностям", en: "Activity comments" },
            { ru: "Кнопка выполнения", en: "Completion button" }
        ]
    },
    {
        version: "0.4",
        title: { ru: "Сообщество", en: "Community" },
        features: [
            { ru: "Публикации и взаимодействия", en: "Posts and interactions" }
        ]
    },
    {
        version: "0.4.1",
        title: { ru: "Контекстное меню", en: "Context menus" },
        features: [
            { ru: "Контекстные действия", en: "Context actions" },
            { ru: "Адаптация меню", en: "Context menu adaptation" }
        ]
    },
    {
        version: "0.4.2",
        title: { ru: "Интерактивность", en: "Interactions" },
        features: [
            { ru: "Интерактивные сообщения", en: "Interactive messages" },
            { ru: "Контакты и медиа", en: "Contacts and media interactions" },
            { ru: "Посты и панель чата", en: "Posts and chat toolbar" }
        ]
    },
    {
        version: "0.4.3",
        title: { ru: "Системные сообщения", en: "System messages" },
        features: [
            { ru: "Системные сообщения", en: "System messages" },
            { ru: "Групповые API", en: "Group endpoints" }
        ]
    },
    {
        version: "0.4.4",
        title: { ru: "Обновление чатов", en: "Chat improvements" },
        features: [
            { ru: "Интерфейс страницы чата", en: "Chat page refresh" }
        ]
    },
    {
        version: "0.4.5",
        title: { ru: "Беседы", en: "Group rooms" },
        features: [
            { ru: "Страница беседы", en: "Group room page" }
        ]
    },
    {
        version: "0.4.6",
        title: { ru: "Приглашения в беседу", en: "Invite members" },
        features: [
            { ru: "Добавление участников", en: "Add group members" }
        ]
    },
    {
        version: "0.4.7",
        title: { ru: "Участники беседы", en: "Manage members" },
        features: [
            { ru: "Исключение участников", en: "Remove group members" }
        ]
    },
    {
        version: "0.4.8",
        title: { ru: "Закреплённые сообщения", en: "Pinned messages" },
        features: [
            { ru: "Закрепление сообщений", en: "Pin messages" }
        ]
    },
    {
        version: "0.4.9",
        title: { ru: "Права в беседе", en: "Chat permissions" },
        features: [
            { ru: "Роли и права участников", en: "Roles and member permissions" }
        ]
    },
    {
        version: "0.5",
        title: { ru: "Интерфейс Афродиты", en: "Aphrodite Interface" },
        features: [
            { ru: "Групповые беседы", en: "Group chats" },
            { ru: "Новая визуальная основа AT", en: "Refined AT interface" }
        ]
    },
    {
        version: "0.5.1",
        title: { ru: "Архив", en: "Archive" },
        features: [
            { ru: "Архивация активностей", en: "Activity archive" }
        ]
    },
    {
        version: "0.5.2",
        title: { ru: "Фильтры меню", en: "Side menu filters" },
        features: [
            { ru: "Фильтрация содержимого SideMenu", en: "SideMenu content filters" }
        ]
    },
    {
        version: "0.5.3",
        title: { ru: "Обновление дизайна", en: "Redesign" },
        features: [
            { ru: "Редизайн интерфейса", en: "Interface redesign" },
            { ru: "Совместный журнал", en: "Collaborative journal" }
        ]
    },
    {
        version: "0.5.4",
        title: { ru: "Таймер и счётчик", en: "Timer and counter" },
        features: [
            { ru: "Таймер выполнения", en: "Completion timer" },
            { ru: "Счётчик прогресса", en: "Progress counter" }
        ]
    },
    {
        version: "0.5.5",
        title: { ru: "Расписание и архив", en: "Schedule and archive" },
        features: [
            { ru: "Расписание активностей", en: "Activity schedule" },
            { ru: "Фильтры SideMenu", en: "SideMenu filters" },
            { ru: "Периодичности дней и дней отдыха", en: "Active/rest-day cycles" },
            { ru: "Кнопки планирования", en: "Planning actions" }
        ]
    },
    {
        version: "0.5.6",
        title: { ru: "Профиль и настройки", en: "Account and settings" },
        features: [
            { ru: "Обновление профиля", en: "Account page update" },
            { ru: "Редизайн настроек", en: "Settings redesign" },
            { ru: "Мобильная адаптация", en: "Mobile layout update" }
        ]
    },
    {
        version: "0.5.7",
        title: { ru: "Язык и оформление", en: "Language and personalization" },
        features: [
            { ru: "Обновление регистрации", en: "Sign-in refresh" },
            { ru: "Информационный раздел", en: "Information pages" },
            { ru: "Персонализация и языки", en: "Personalization and languages" }
        ]
    },
    {
        version: "0.5.8",
        title: { ru: "Гостевой доступ", en: "Guest access" },
        features: [
            { ru: "Гостевой режим", en: "Guest access" },
            { ru: "Кнопки планирования", en: "Plan button" }
        ]
    },
    {
        version: "0.5.9",
        title: { ru: "Статистика и циклы", en: "Stats and cycles" },
        features: [
            { ru: "Статистика активностей", en: "Activity statistics" },
            { ru: "Циклическая периодичность", en: "Cyclic activity scheduling" },
            { ru: "Улучшение модалок", en: "Modal improvements" }
        ]
    }
];

export const roadmapCurrent: RoadmapRelease = {
    version: "0.6",
    title: { ru: "Эра сотрудничества", en: "Era of Collaboration" },
    features: [
        { ru: "Совместные активности и активности внутри бесед", en: "Shared activities and activities in group chats" },
        { ru: "Личное или общее выполнение для участников", en: "Personal or shared completion for participants" },
        { ru: "Права и роли в беседах, управление участниками", en: "Chat roles, permissions and member management" },
        { ru: "Редактор постов с форматированием и медиа", en: "Rich-text post editor with media" },
        { ru: "Страницы постов, комментарии и действия с публикациями", en: "Post pages, comments and post actions" },
        { ru: "Приглашения и QR-коды, журнал совместной активности", en: "Invitations, QR codes and shared activity history" },
        { ru: "Тестирование совместок, прав и редактора ещё продолжается", en: "QA for collaboration, permissions and editor is still in progress" }
    ]
};

export const roadmapFuture: RoadmapRelease[] = [
    {
        version: "0.7+",
        title: { ru: "Новые горизонты", en: "New Horizons" },
        features: [
            { ru: "Цели и расширенная аналитика активностей", en: "Goals and extended activity analytics" },
            { ru: "Развитие комментариев и ответов", en: "Expanded comments and replies" },
            { ru: "Улучшения поиска и связанных настроек", en: "Search and linked settings improvements" },
            { ru: "Дальнейшее развитие сообщества и чатов", en: "Further community and chat features" }
        ]
    }
];
