export interface RoadmapText {
    ru: string;
    en: string;
}

export interface RoadmapRelease {
    version: string;
    date?: string;
    title?: RoadmapText;
    features: RoadmapText[];
    notice?: RoadmapText;
}

export const roadmapHistory: RoadmapRelease[] = [
    {
        version: "0.0.1",
        features: [
            { ru: "Первый экран входа", en: "Initial sign-in screen" }
        ]
    },
    {
        version: "0.0.2",
        features: [
            { ru: "UserContext и подтверждение почты", en: "UserContext and email confirmation" }
        ]
    },
    {
        version: "0.0.3",
        features: [
            { ru: "Первая версия главной страницы", en: "First home page" }
        ]
    },
    {
        version: "0.0.4",
        features: [
            { ru: "Первая версия SideMenu", en: "First SideMenu" }
        ]
    },
    {
        version: "0.0.5",
        features: [
            { ru: "Страница аккаунта и редактирование профиля", en: "Account page and profile editing" }
        ]
    },
    {
        version: "0.1",
        date: "2025-08-26",
        title: { ru: "Foundation", en: "Foundation" },
        features: [
            { ru: "Основа приложения и навигации", en: "Core application and navigation" }
        ]
    },
    {
        version: "0.1.1",
        features: [
            { ru: "Добавление привычек", en: "Create habits" }
        ]
    },
    {
        version: "0.1.2",
        features: [
            { ru: "HabitContext", en: "HabitContext" }
        ]
    },
    {
        version: "0.1.3",
        features: [
            { ru: "Активности в SideMenu", en: "Habits in SideMenu" },
            { ru: "Страница активности", en: "Habit page" }
        ]
    },
    {
        version: "0.2",
        date: "2025-09-22",
        title: { ru: "Act", en: "Act" },
        features: [
            { ru: "Основные инструменты привычек", en: "Core habit tools" }
        ]
    },
    {
        version: "0.2.1",
        features: [
            { ru: "Контакты в SideMenu", en: "Contacts in SideMenu" },
            { ru: "Поиск в SideMenu", en: "SideMenu search" }
        ]
    },
    {
        version: "0.2.2",
        features: [
            { ru: "Первые интерфейсы переписки", en: "Early messaging interface" }
        ]
    },
    {
        version: "0.2.3",
        features: [
            { ru: "Улучшения страницы аккаунта", en: "Account page improvements" }
        ]
    },
    {
        version: "0.2.4",
        features: [
            { ru: "WebSocket", en: "WebSocket" },
            { ru: "Отправка и отображение сообщений", en: "Message sending and display" }
        ]
    },
    {
        version: "0.3",
        date: "2025-10-14",
        title: { ru: "Dialogue", en: "Dialogue" },
        features: [
            { ru: "Личные чаты", en: "Личные чаты" }
        ]
    },
    {
        version: "0.3.1",
        features: [
            { ru: "Текстовое поле для публикаций", en: "Post text input" }
        ]
    },
    {
        version: "0.3.2",
        features: [
            { ru: "Публикации пользователя", en: "User posts" }
        ]
    },
    {
        version: "0.3.3",
        features: [
            { ru: "Публикации контактов на главной", en: "Contacts' posts on home" }
        ]
    },
    {
        version: "0.3.4",
        features: [
            { ru: "Лайки и комментарии к постам", en: "Post likes and comments" }
        ]
    },
    {
        version: "0.3.5",
        features: [
            { ru: "Календарь активности", en: "Activity calendar" }
        ]
    },
    {
        version: "0.3.6",
        features: [
            { ru: "Стрики", en: "Streaks" },
            { ru: "Комментарии к активностям", en: "Activity comments" },
            { ru: "Кнопка выполнения", en: "Completion button" }
        ]
    },
    {
        version: "0.4",
        date: "2025-10-23",
        title: { ru: "Firework", en: "Firework" },
        features: [
            { ru: "Публикации и взаимодействия", en: "Posts and interactions" }
        ]
    },
    {
        version: "0.4.1",
        features: [
            { ru: "Контекстные действия", en: "Context actions" },
            { ru: "Контекстное меню для сообщений", en: "Message context menu" },
            { ru: "Адаптация меню", en: "Context menu adaptation" }
        ]
    },
    {
        version: "0.4.2",
        features: [
            { ru: "Интерактивные сообщения", en: "Interactive messages" },
            { ru: "Ответы и удаление сообщений", en: "Message replies and deletion" },
            { ru: "Бот уведомлений AT", en: "AT notification bot" },
            { ru: "Контакты и медиа", en: "Contacts and media interactions" },
            { ru: "Посты и панель чата", en: "Posts and chat toolbar" }
        ]
    },
    {
        version: "0.4.3",
        features: [
            { ru: "Системные сообщения", en: "System messages" },
            { ru: "Групповые API", en: "Group endpoints" },
            { ru: "Создание групповых бесед", en: "Group chat creation" }
        ]
    },
    {
        version: "0.4.4",
        features: [
            { ru: "Интерфейс страницы чата", en: "Chat page refresh" }
        ]
    },
    {
        version: "0.4.5",
        features: [
            { ru: "Страница беседы", en: "Group room page" }
        ]
    },
    {
        version: "0.4.6",
        features: [
            { ru: "Добавление участников", en: "Add group members" },
            { ru: "Приглашения участников", en: "Member invitations" }
        ]
    },
    {
        version: "0.4.7",
        features: [
            { ru: "Исключение участников", en: "Remove group members" }
        ]
    },
    {
        version: "0.4.7.2",
        date: "2026-01-21",
        features: [
            { ru: "Исправления удаления участников и групповых бесед", en: "Member removal and group chat fixes" }
        ]
    },
    {
        version: "0.4.8",
        features: [
            { ru: "Закрепление сообщений", en: "Pin messages" }
        ]
    },
    {
        version: "0.4.9",
        features: [
            { ru: "Роли и права участников", en: "Roles and member permissions" }
        ]
    },
    {
        version: "0.5",
        date: "2026-01-25",
        title: { ru: "Aphrodite", en: "Aphrodite" },
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Групповые беседы", en: "Group chats" },
            { ru: "Новая визуальная основа AT", en: "Refined AT interface" }
        ]
    },
    {
        version: "0.5.1",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Архивация активностей", en: "Activity archive" }
        ]
    },
    {
        version: "0.5.2",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Фильтрация содержимого SideMenu", en: "SideMenu content filters" }
        ]
    },
    {
        version: "0.5.3",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Редизайн интерфейса", en: "Interface redesign" },
            { ru: "Совместный журнал", en: "Collaborative journal" }
        ]
    },
    {
        version: "0.5.4",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Таймер выполнения", en: "Completion timer" },
            { ru: "Счётчик прогресса", en: "Progress counter" }
        ]
    },
    {
        version: "0.5.5",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Расписание активностей", en: "Activity schedule" },
            { ru: "Фильтры SideMenu", en: "SideMenu filters" },
            { ru: "Периодичности дней и дней отдыха", en: "Active/rest-day cycles" },
            { ru: "Кнопки планирования", en: "Planning actions" }
        ]
    },
    {
        version: "0.5.6",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Обновление профиля", en: "Account page update" },
            { ru: "Редизайн настроек", en: "Settings redesign" },
            { ru: "Мобильная адаптация", en: "Mobile layout update" }
        ]
    },
    {
        version: "0.5.7",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Обновление регистрации", en: "Sign-in refresh" },
            { ru: "Информационный раздел", en: "Information pages" },
            { ru: "Персонализация и языки", en: "Personalization and languages" }
        ]
    },
    {
        version: "0.5.8",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Гостевой режим", en: "Guest access" },
            { ru: "Кнопки планирования", en: "Plan button" },
            { ru: "Статистика активностей", en: "Activity statistics" },
            { ru: "QR-коды приглашений", en: "Invitation QR codes" }
        ]
    },
    {
        version: "0.5.9",
        date: "2026-08-16",
        features: [
            { ru: "Улучшение интерфейса", en: "Interface improvements" },
            { ru: "Циклическая периодичность", en: "Cyclic activity scheduling" },
            { ru: "Улучшение модалок", en: "Modal improvements" },
            { ru: "Редактор и страницы постов: форматирование, медиа, комментарии и действия с публикациями", en: "Post editor and pages: rich text, media, comments and post actions" }
        ]
    },
    {
        version: "0.6",
        date: "2026-10-31",
        title: { ru: "Affinity", en: "Affinity" },
        features: [
            { ru: "Совместные активности и активности внутри бесед", en: "Shared activities and activities in group chats" },
            { ru: "Приглашения и управление участниками совместных активностей", en: "Shared activity invitations and member management" },
            { ru: "Личное или общее выполнение для участников", en: "Personal or shared completion for participants" }
        ]
    },
    {
        version: "0.6.1",
        date: "2026-11-02",
        features: [
            { ru: "Восстановление и смена пароля", en: "Password recovery and password changes" },
            { ru: "Авторизованные устройства и управление сессиями", en: "Authorized devices and session management" },
            { ru: "Настройки cookies и улучшения безопасности входа", en: "Cookie preferences and sign-in security improvements" },
            { ru: "Исправления интерфейса и навигации", en: "Interface and navigation fixes" }
        ]
    }
];

export const roadmapCurrent: RoadmapRelease = {
    version: "0.6.2",
    date: "2026-11-04",
    title: { ru: "Новая палитра", en: "New palette" },
    features: [
        { ru: "Новая статистика активностей и исправление расписания", en: "Refreshed activity statistics and schedule layout fixes" },
        { ru: "Собственные цвета акцента и градиента", en: "Custom accent and gradient colors" },
        { ru: "Десять новых стандартных фонов и анимации", en: "Ten new built-in backgrounds and animations" },
        { ru: "Настройка скорости анимации фонов", en: "Configurable background animation speed" },
        { ru: "Переработка интерфейса фоновых изображений", en: "Background image interface redesign" },
        { ru: "Улучшения мобильного интерфейса", en: "Mobile interface improvements" }
    ],
    notice: {
        ru: "Продолжается тестирование на мобильных устройствах",
        en: "Mobile device testing is ongoing"
    }
};

export const roadmapFuture: RoadmapRelease[] = [
    {
        version: "0.7",
        title: { ru: "The Castle", en: "The Castle" },
        features: [
            { ru: "Споты — пространства для сообществ и интересов", en: "Spots — spaces for communities and shared interests" },
            { ru: "Публикации и обсуждения внутри спотов", en: "Posts and discussions within spots" },
            { ru: "Участники, подписки и взаимодействия", en: "Members, subscriptions and interactions" }
        ]
    },
    {
        version: "0.6+",
        features: [
            { ru: "Цели и расширенная аналитика активностей", en: "Goals and extended activity analytics" },
            { ru: "Развитие комментариев и ответов", en: "Expanded comments and replies" },
            { ru: "Улучшения поиска и связанных настроек", en: "Search and linked settings improvements" },
            { ru: "Дальнейшее развитие сообщества и чатов", en: "Further community and chat features" }
        ]
    }
];
