import { ImageIcon, MoonStarsIcon, PaintBucketIcon, PaintRollerIcon, PaletteIcon, SunIcon, TextIndentIcon, TrashIcon, PhoneIcon, EnvelopeIcon, UserIcon, PencilSimpleIcon, ChatsTeardropIcon, HandTapIcon, CursorClickIcon, TextAaIcon, CalendarBlankIcon, ClockIcon, TranslateIcon, GifIcon, HardDrivesIcon, ImageSquareIcon, CheckCircleIcon, ArchiveIcon, BellIcon, BellRingingIcon, LockIcon, NewspaperIcon, ShieldCheckIcon, KeyIcon, DevicesIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { SearchableSetting } from "../Settings";
import type { ElementType } from "react";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { MirrorRectangularIcon } from "lucide-react";
import { isMobile } from "react-device-detect";
import { reactionsArr } from "../../../components/ts/utils/emojies";
import { ChatCircleIcon, ListNumbersIcon } from "@phosphor-icons/react/dist/ssr";

export interface SearchableSection {
    id: string;
    name: string;
    items: SearchableSetting[];
    icon: ElementType;
}

export function useSearchableSettings(): SearchableSection[] {
    const { t } = useTranslation("settings");
    const { isDark, decor, blur, emote, lang } = useSettings();

    return [
        {
            id: "pers",
            name: t("settings.personalization"),
            icon: PaintBucketIcon,
            items: [
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
                    id: "decor",
                    name: t("personalization.decor"),
                    icon: decor === "default" ? PaintBucketIcon : MirrorRectangularIcon,
                    category: t("settings.personalization"),
                },
                {
                    id: "blur",
                    name: "Степень размытия",
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
                {
                    id: "layout",
                    name: "Боковое меню",
                    icon: TextIndentIcon,
                    category: t("settings.personalization"),
                },
            ],
        },
        {
            id: "general",
            name: t("settings.general"),
            icon: TextAaIcon,
            items: [
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
                    id: "timeFormat",
                    name: t("general.timeFormat"),
                    icon: ClockIcon,
                    category: t("general.text"),
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
                    name: "Редактировать профиль",
                    icon: PencilSimpleIcon,
                    category: t("settings.account") || "Аккаунт",
                },
                {
                    id: "phone",
                    name: "Изменить номер телефона",
                    icon: PhoneIcon,
                    category: t("settings.account") || "Аккаунт",
                },
                {
                    id: "email",
                    name: "Изменить email",
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
            name: "Чаты",
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
            ],
        },
        {
            id: "habits",
            name: "Активности",
            icon: CheckCircleIcon,
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
                    id: "weekStart",
                    name: t("habits.weekStartFrom"),
                    icon: CalendarBlankIcon,
                    category: t("habits.schedule"),
                },
                {
                    id: "orderHabits",
                    name: t("habits.displayOrder"),
                    icon: ListNumbersIcon,
                    category: t("habits.displayOrder"),
                },
            ],
        },
        {
            id: "notifications",
            name: t("settings.notifications"),
            icon: BellIcon,
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
                {
                    id: "habitsNote",
                    name: t("notifications.remindAboutActivities"),
                    icon: BellRingingIcon,
                    category: t("notifications.reminders"),
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
                    id: "number",
                    name: t("privacy.whoSeesPhone"),
                    icon: PhoneIcon,
                    category: t("privacy.accountInfo"),
                },
                {
                    id: "mail",
                    name: t("privacy.whoSeesEmail"),
                    icon: EnvelopeIcon,
                    category: t("privacy.accountInfo"),
                },
                {
                    id: "habits",
                    name: t("privacy.whoSeesActivities"),
                    icon: CheckCircleIcon,
                    category: t("privacy.contentVisibility"),
                },
                {
                    id: "posts",
                    name: t("privacy.whoSeesPosts"),
                    icon: NewspaperIcon,
                    category: t("privacy.contentVisibility"),
                },
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
            ],
        },
    ];
}