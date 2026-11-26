import { ImageIcon, StackIcon, MoonStarsIcon, PaintBucketIcon, PaintRollerIcon, PaletteIcon, SunIcon, TextIndentIcon, TrashIcon, EnvelopeIcon, UserIcon, PencilSimpleIcon, ChatsTeardropIcon, HandTapIcon, CursorClickIcon, TextAaIcon, CalendarBlankIcon, ClockIcon, TranslateIcon, GifIcon, HardDrivesIcon, ImageSquareIcon, CheckCircleIcon, ArchiveIcon, BellIcon, BellRingingIcon, LockIcon, NewspaperIcon, ShieldCheckIcon, KeyIcon, DevicesIcon, WrenchIcon, SneakerMoveIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { SearchableSetting } from "../Settings";
import type { ElementType } from "react";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { MirrorRectangularIcon } from "lucide-react";
import useCompactLayout from "../../../components/hooks/utils/useCompactLayout";
import { reactionsArr } from "../../../components/ts/utils/emojies";
import { ChatCircleIcon } from "@phosphor-icons/react/dist/ssr";

export interface SearchableSection {
    id: string;
    name: string;
    aliases?: string[];
    items: SearchableSetting[];
    icon: ElementType;
}

export function matchesSettingSearch(section: SearchableSection, item: SearchableSetting, query: string) {
    const terms = [section.name, ...(section.aliases ?? []), item.name, item.category, item.id];
    if (item.id === "bg") terms.push("обои", "фон", "фоны", "wallpaper", "wallpapers", "background");
    return terms.some(term => term?.toLowerCase().includes(query));
}

export function useSearchableSettings(includeUnavailable = false): SearchableSection[] {
    const { t } = useTranslation("settings");
    const { isDark, decor, blur, emote, lang } = useSettings();
    const isMobile = useCompactLayout();

    return [
        {
            id: "pers",
            name: t("settings.personalization"),
            icon: PaintBucketIcon,
            items: [
                ...(includeUnavailable || document.documentElement.dataset.atNative === "true" ? [{
                    id: "interfaceStyle",
                    name: t("personalization.interfaceStyle"),
                    icon: PaintBucketIcon,
                    category: t("settings.personalization"),
                }] : []),
                {
                    id: "theme",
                    name: t("personalization.theme"),
                    icon: isDark ? MoonStarsIcon : SunIcon,
                    category: t("settings.personalization"),
                },
                {
                    id: "accent",
                    name: t("personalization.accentColors"),
                    icon: PaletteIcon,
                    category: t("settings.personalization"),
                    options: {
                        icon2: PaintRollerIcon,
                        icon_color: "var(--accent)",
                        icon2_color: "var(--grad)",
                    },
                },
                {
                    id: "mainColor",
                    name: t("personalization.mainColor"),
                    icon: PaletteIcon,
                    category: t("settings.personalization"),
                },
                {
                    id: "grad",
                    name: t("personalization.gradient"),
                    icon: PaintRollerIcon,
                    category: t("settings.personalization"),
                    options: {
                        icon_color: "var(--grad)",
                    },
                },
                {
                    id: "customColors", name: t("personalization.customColors"), icon: PaletteIcon, category: t("personalization.accentColors"),
                },
                {
                    id: "decor",
                    name: t("personalization.decor"),
                    icon: decor === "default" ? PaintBucketIcon : MirrorRectangularIcon,
                    category: t("settings.personalization"),
                },
                {
                    id: "blur",
                    name: t("personalization.decorBlur"),
                    icon: null,
                    category: t("settings.personalization"),
                    options: { icon_text: `${blur.toString()}px` },
                },
                {
                    id: "bg",
                    name: t("personalization.background"),
                    icon: ImageIcon,
                    category: t("settings.personalization"),
                },
                ...([["backgroundBlur", "blurBackground"], ["backgroundMovement", "movement"], ["backgroundSpeed", "speed"], ["backgroundFilters", "filters"]] as const).map(([id, key]) => ({
                    id, name: t("backgroundLibrary." + key), icon: ImageIcon, category: t("personalization.background")
                })),
                {
                    id: "compositions",
                    name: t("personalization.compositions.title"),
                    icon: StackIcon,
                    category: t("settings.personalization"),
                },
                ...(includeUnavailable || !isMobile ? [{
                    id: "layout",
                    name: t("personalization.sideMenu"),
                    icon: TextIndentIcon,
                    category: t("settings.personalization"),
                }] : []),
            ],
        },
        {
            id: "gen",
            name: t("settings.general"),
            aliases: [t("settings.generalSearchName"), t("settings.generalSearchLegacyName")],
            icon: WrenchIcon,
            items: [
                {
                    id: "startupPage",
                    name: t("general.startupPage"),
                    icon: NewspaperIcon,
                    category: t("general.startupTitle"),
                },
                {
                    id: "previewCompositionOnTap",
                    name: t("general.previewCompositionOnTap"),
                    icon: HandTapIcon,
                    category: t("general.experimental"),
                },{
                    id: "highlightContextEdges",
                    name: t("general.highlightContextEdges"),
                    icon: HandTapIcon,
                    category: t("general.experimental"),
                },
                ...(includeUnavailable || isMobile ? [{
                    id: "sideMenuSwipe",
                    name: t("general.sideMenuSwipe"),
                    icon: HandTapIcon,
                    category: t("general.startupTitle"),
                },{
                    id: "showMobileMenuOnStart",
                    name: t("general.showMobileMenuOnStart"),
                    icon: TextIndentIcon,
                    category: t("general.startupTitle"),
                },{
                    id: "startupSideMenuTab",
                    name: t("general.startupSideMenuTab"),
                    icon: ChatsTeardropIcon,
                    category: t("general.startupTitle"),
                }] : []),
                {
                    id: "autoLoadImages",
                    name: t("general.autoLoadImages"),
                    icon: ImageSquareIcon,
                    category: t("general.traffic"),
                },
                {
                    id: "autoPlayGif",
                    name: t("general.autoPlayGif"),
                    icon: GifIcon,
                    category: t("general.traffic"),
                },
                {
                    id: "useImageCache",
                    name: t("general.useImageCache"),
                    icon: HardDrivesIcon,
                    category: t("general.traffic"),
                },
                {
                    id: "fontSize",
                    name: t("general.fontSize"),
                    icon: TextAaIcon,
                    category: t("general.text"),
                },
                {
                    id: "dateFormat",
                    name: t("general.dateFormat"),
                    icon: CalendarBlankIcon,
                    category: t("general.text"),
                },
                {
                    id: "timeZone",
                    name: t("general.timeZone"),
                    icon: ClockIcon,
                    category: t("general.text"),
                },
                {
                    id: "timeFormat",
                    name: t("general.timeFormat"),
                    icon: ClockIcon,
                    category: t("general.text"),
                },
                {
                    id: "quickActions",
                    name: t("general.quickActionsTitle"),
                    icon: WrenchIcon,
                    category: t("settings.general"),
                },
                {
                    id: "language",
                    name: t("general.language"),
                    icon: TranslateIcon,
                    category: t("settings.general"),
                    options: {
                        icon_text: lang.toUpperCase(),
                    },
                },
            ],
        },
        {
            id: "acc",
            name: t("settings.account") || "Аккаунт",
            icon: UserIcon,
            items: [
                {
                    id: "editAcc",
                    name: t("acc.edit"),
                    icon: PencilSimpleIcon,
                    category: t("settings.account") || "Аккаунт",
                },
                {
                    id: "email",
                    name: t("acc.changeEmail"),
                    icon: EnvelopeIcon,
                    category: t("settings.account") || "Аккаунт",
                },
                {
                    id: "deleteAccount",
                    name: t("acc.deleteAccount") || "Удалить аккаунт",
                    icon: TrashIcon,
                    category: t("settings.account") || "Аккаунт",
                    options: { isDanger: true, icon_color: "var(--notValid)" },
                },
            ],
        },
        {
            id: "chats",
            name: t("settings.chats"),
            icon: ChatsTeardropIcon,
            items: [
                {
                    id: "defaultReaction",
                    name: t("chats.defaultReaction"),
                    icon: null,
                    category: t("chats.header"),
                    options: {
                        icon_text: reactionsArr.find((el) => el.value === emote)?.label,
                    },
                },
                {
                    id: "doubleClick",
                    name: t("chats.doubleClick"),
                    icon: isMobile ? HandTapIcon : CursorClickIcon,
                    category: t("chats.header"),
                },
                {
                    id: "sendTypingStatus",
                    name: t("chats.sendTypingStatus"),
                    icon: ChatsTeardropIcon,
                    category: t("chats.typingTitle"),
                },
                {
                    id: "enterToSend",
                    name: t("chats.enterToSend"),
                    icon: ChatsTeardropIcon,
                    category: t("chats.keyboardTitle"),
                },
                {
                    id: "savedSmartSuggestions",
                    name: t("chats.savedSmartSuggestions"),
                    icon: CalendarBlankIcon,
                    category: t("chats.savedTitle"),
                },
                {
                    id: "welcomeMessage",
                    name: t("chats.welcomeTitle"),
                    icon: ChatsTeardropIcon,
                    category: t("settings.chats"),
                },
            ],
        },
        {
            id: "activities",
            name: t("settings.activities"),
            icon: SneakerMoveIcon,
            items: [
                {
                    id: "showArchived",
                    name: t("habits.archivedInSideMenu"),
                    icon: ArchiveIcon,
                    category: t("habits.archive"),
                },
                {
                    id: "showArchivedInAcc",
                    name: t("habits.archivedInProfile"),
                    icon: ArchiveIcon,
                    category: t("habits.archive"),
                },
                {
                    id: "showHabitGoals",
                    name: t("habits.showGoals"),
                    icon: SneakerMoveIcon,
                    category: t("habits.goals"),
                },
                {
                    id: "showFeedDaySummary",
                    name: t("habits.showFeedDaySummary"),
                    icon: CalendarBlankIcon,
                    category: t("habits.feed"),
                },
                {
                    id: "weekStart",
                    name: t("habits.weekStartFrom"),
                    icon: CalendarBlankIcon,
                    category: t("habits.schedule"),
                },
            ],
        },
        {
            id: "notes",
            name: t("settings.notifications"),
            icon: BellRingingIcon,
            items: [
                {
                    id: "note",
                    name: t("notifications.generalNotifications"),
                    icon: BellIcon,
                    category: t("notifications.general"),
                },
                {
                    id: "messNote",
                    name: t("notifications.newMessages"),
                    icon: ChatCircleIcon,
                    category: t("notifications.general"),
                },
                { id: "mentionsNote", name: t("notifications.mentions"), icon: BellIcon, category: t("notifications.general") },
                { id: "browserNotifications", name: t("notifications.browserTitle"), icon: BellIcon, category: t("notifications.general") },
                {
                    id: "habitsNote",
                    name: t("notifications.remindAboutActivities"),
                    icon: BellRingingIcon,
                    category: t("notifications.reminders"),
                },
                {
                    id: "planReminders",
                    name: t("notifications.planRemindersTitle"),
                    icon: BellIcon,
                    category: t("notifications.reminders"),
                },
                {
                    id: "activityReminders", name: t("notifications.activityReminders"), icon: BellRingingIcon, category: t("notifications.reminders"),
                },
                {
                    id: "commonReminderTime",
                    name: t("notifications.commonReminderTime"),
                    icon: ClockIcon,
                    category: t("notifications.reminders"),
                },
            ],
        },
        {
            id: "privacy",
            name: t("settings.privacy"),
            icon: LockIcon,
            items: [
                {
                    id: "profile",
                    name: t("privacy.whoSeesAccountInfo"),
                    icon: UserIcon,
                    category: t("privacy.accountInfo"),
                },
                {
                    id: "habits",
                    name: t("privacy.whoSeesActivities"),
                    icon: CheckCircleIcon,
                    category: t("privacy.activitiesVisibility"),
                },
                {
                    id: "posts",
                    name: t("privacy.whoSeesPosts"),
                    icon: NewspaperIcon,
                    category: t("privacy.postsVisibility"),
                },
                {
                    id: "plans",
                    name: t("privacy.whoSeesPlans"),
                    icon: CalendarBlankIcon,
                    category: t("privacy.plansVisibility"),
                },
                {
                    id: "activityInvites",
                    name: t("privacy.exceptions.activityWho"),
                    icon: SneakerMoveIcon,
                    category: t("privacy.exceptions.activityTitle"),
                },
                {
                    id: "planInvites",
                    name: t("privacy.planInvitesWho"),
                    icon: CalendarBlankIcon,
                    category: t("privacy.planInvitesTitle"),
                },
                {
                    id: "groupInviteContacts",
                    name: t("privacy.invites.contacts"),
                    icon: ChatsTeardropIcon,
                    category: t("privacy.invites.title"),
                },
                { id: "groupInviteOthers", name: t("privacy.invites.others"), icon: ChatsTeardropIcon, category: t("privacy.invites.title") },
                { id: "profileExceptions", name: t("catalog.exceptions.profile"), icon: LockIcon, category: t("privacy.accountInfo"), options: { icon2: UserIcon } },
                { id: "habitsExceptions", name: t("catalog.exceptions.habits"), icon: LockIcon, category: t("privacy.activitiesVisibility"), options: { icon2: CheckCircleIcon } },
                { id: "postsExceptions", name: t("catalog.exceptions.posts"), icon: LockIcon, category: t("privacy.postsVisibility"), options: { icon2: NewspaperIcon } },
                { id: "plansExceptions", name: t("catalog.exceptions.plans"), icon: LockIcon, category: t("privacy.plansVisibility"), options: { icon2: CalendarBlankIcon } },
                { id: "activityExceptions", name: t("catalog.exceptions.activityInvites"), icon: LockIcon, category: t("privacy.exceptions.activityTitle"), options: { icon2: SneakerMoveIcon } },
                { id: "plan-inviteExceptions", name: t("catalog.exceptions.planInvites"), icon: LockIcon, category: t("privacy.planInvitesTitle"), options: { icon2: CalendarBlankIcon } },
                { id: "groupExceptions", name: t("catalog.exceptions.groupInvites"), icon: LockIcon, category: t("privacy.invites.title"), options: { icon2: ChatsTeardropIcon } },
            ],
        },
        {
            id: "security",
            name: t("settings.security"),
            icon: ShieldCheckIcon,
            items: [
                {
                    id: "twoAuth",
                    name: t("security.twoFactor"),
                    icon: ShieldCheckIcon,
                    category: t("security.twoFactor"),
                },
                {
                    id: "changePassword",
                    name: t("security.changePassword"),
                    icon: KeyIcon,
                    category: t("security.changePassword"),
                },
                {
                    id: "devices",
                    name: t("security.devices"),
                    icon: DevicesIcon,
                    category: t("security.devices"),
                },
                {
                    id: "cookieConsent", name: t("privacy.cookies"), icon: ShieldCheckIcon, category: t("settings.security"),
                },
                {
                    id: "showLinkPreview",
                    name: t("security.linkPreview"),
                    icon: ShieldCheckIcon,
                    category: t("settings.security"),
                },
            ],
        },
    ];
}