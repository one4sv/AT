import { useEffect, useState, type ElementType } from "react";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/settings.scss";
import {
    BellRingingIcon,
    CaretLeftIcon,
    ChatsTeardropIcon,
    GearIcon,
    InfoIcon,
    LockKeyIcon,
    MagnifyingGlassIcon,
    PaintBucketIcon,
    SneakerMoveIcon,
    UserIcon,
    VaultIcon,
} from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router";
import AccSettingsTab from "./components/SettingsTabs/AccSettingsTab";
import PersSettingsTab from "./components/SettingsTabs/PersSettingTab";
import HabitsTab from "./components/SettingsTabs/HabitsTab";
import NotificationsTab from "./components/SettingsTabs/NotificationsTab";
import ChatsTab from "./components/SettingsTabs/ChatsTab";
import PrivacyTab from "./components/SettingsTabs/PrivacyTab";
import SecurityTab from "./components/SettingsTabs/SecurityTab";
import GeneralTab from "./components/SettingsTabs/GeneralTab";
import { useAcc } from "../../components/hooks/AccHook";
import { useTranslation } from "react-i18next";

export interface setting {
    name: string;
    tab: string;
    desc: string;
    icon: ElementType;
}

export default function Settings() {
    const { t } = useTranslation("settings");
    const { setTitle } = usePageTitle();
    const { user, isAuthenticated, loadingUser } = useUser();
    const { setIsMyAcc } = useAcc();

    const { tab } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<setting | null>(null);
    
    useEffect(() => {
        if (!user.id && !loadingUser) { 
            navigate("/sign");
        }
    }, [isAuthenticated, loadingUser, navigate, user]);

    useEffect(() => {
        setTitle(t("settings.title"));
        setIsMyAcc(true);
    }, [setIsMyAcc, setTitle, user.nick, t]);

    const settings: setting[] = [
        {
            name: t("settings.general"),
            tab: "gen",
            desc: t("settings.generalDesc"),
            icon: GearIcon,
        },
        {
            name: t("settings.personalization"),
            tab: "pers",
            desc: t("settings.personalizationDesc"),
            icon: PaintBucketIcon,
        },
        {
            name: t("settings.activities"),
            tab: "activites",
            desc: t("settings.activitiesDesc"),
            icon: SneakerMoveIcon,
        },
        {
            name: t("settings.chats"),
            tab: "chats",
            desc: t("settings.chatsDesc"),
            icon: ChatsTeardropIcon,
        },
        {
            name: t("settings.notifications"),
            tab: "notes",
            desc: t("settings.notificationsDesc"),
            icon: BellRingingIcon,
        },
        {
            name: t("settings.security"),
            tab: "safety",
            desc: t("settings.securityDesc"),
            icon: VaultIcon,
        },
        {
            name: t("settings.privacy"),
            tab: "private",
            desc: t("settings.privacyDesc"),
            icon: LockKeyIcon,
        },
    ];

    const accTab = {
        name: user.username ?? user.nick ?? t("settings.account"),
        desc: t("settings.accountDesc"),
        icon: UserIcon,
        tab: "acc",
    };

    useEffect(() => {
        if (tab) {
            if (tab === "acc") setActiveTab(accTab);
            else setActiveTab(settings.find(s => s.tab === tab) ?? null);
        }
    }, [tab, t]);

    const tabs = {
        gen: <GeneralTab />,
        acc: <AccSettingsTab />,
        pers: <PersSettingsTab />,
        activites: <HabitsTab />,
        chats: <ChatsTab />,
        notes: <NotificationsTab />,
        safety: <SecurityTab />,
        private: <PrivacyTab />,
    };

    return (
        <div className="settingsDiv">
            <div className="settingsSliderWrapper">
                <div
                    className="settingsSlider"
                    style={{
                        transform: tab ? "translateX(-50%)" : "translateX(0)",
                    }}
                >
                    <div className="settingsPage">
                        <div className="settingSearch">
                            <input 
                                type="text" 
                                className="settingSearchInput" 
                                placeholder={t("settings.searchPlaceholder")}
                            />
                            <MagnifyingGlassIcon size={20} />
                        </div>
                        <div
                            className="settingButt"
                            onClick={() => {
                                navigate(`/settings/${accTab.tab}`);
                                setActiveTab(accTab);
                            }}
                        >
                            <span className="settingName">
                                {user.avatar_url ? (
                                    <img className="settingAvatar" src={user.avatar_url} />
                                ) : (
                                    <div className="settingAvatar">
                                        <UserIcon size={28} weight="fill" />
                                    </div>
                                )}
                                {user.username ? (
                                    <>
                                        <span className="settingUserName">{user.username}</span>{" "}
                                        <span className="settingUserNick">| @{user.nick}</span>
                                    </>
                                ) : (
                                    <>@{user.nick}</>
                                )}
                            </span>
                            <div className="settingDesc">
                                {t("settings.accountDesc")}
                            </div>
                        </div>
                        <div className="settingsButtsWrapper">
                            {settings.map((s) => (
                                <div
                                    key={s.tab}
                                    className="settingButt"
                                    onClick={() => {
                                        setActiveTab(s);
                                        navigate(`/settings/${s.tab}`);
                                    }}
                                >
                                    <span className="settingName">
                                        <s.icon size={24} weight="fill" />
                                        {s.name}
                                    </span>
                                    <div className="settingDesc">{s.desc}</div>
                                </div>
                            ))}
                            <div
                                className="settingButt"
                                onClick={() => {
                                    navigate("/info");
                                }}
                            >
                                <span className="settingName">
                                    <InfoIcon size={24} weight="fill" />
                                    {t("settings.info")}
                                </span>
                                <div className="settingDesc">{t("settings.infoDesc")}</div>
                            </div>
                        </div>
                    </div>
                    <div className="settingsPage">
                        {activeTab && (
                            <>
                                <div className="settingBack" onClick={() => {
                                    navigate(`/settings`);
                                }}>
                                    <CaretLeftIcon size={24} />
                                    <h2>{activeTab.name}</h2>
                                </div>
                                {tabs[activeTab.tab as keyof typeof tabs]}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}