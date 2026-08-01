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

export interface setting {
    name: string;
    tab: string;
    desc: string;
    icon: ElementType;
}
export default function Settings() {
    const { setTitle } = usePageTitle();
    const { user, isAuthenticated, loadingUser } = useUser();
    const { setIsMyAcc } = useAcc()

    const { tab } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<setting | null>(null);
    
    useEffect(() => {
        if (!user.id && !loadingUser) { 
            navigate("/sign");
        }
    }, [isAuthenticated, loadingUser, navigate, user]);

    useEffect(() => {
        setTitle(`настройки`);
        setIsMyAcc(true)
    }, [setIsMyAcc, setTitle, user.nick]);

    const settings: setting[] = [
        {
            name: "Общие",
            tab: "gen",
            desc: "Смена языка, экономия трафика и размер текста",
            icon: GearIcon,
        },
        {
            name: "Персонализация",
            tab: "pers",
            desc: "Тема, внешний вид и оформление приложения",
            icon: PaintBucketIcon,
        },
        {
            name: "Активности",
            tab: "activites",
            desc: "Порядок отображения активностей, архив и расписание недель",
            icon: SneakerMoveIcon,
        },
        {
            name: "Чаты",
            tab: "chats",
            desc: "Сообщения, группы и параметры общения",
            icon: ChatsTeardropIcon,
        },
        {
            name: "Уведомления",
            tab: "notes",
            desc: "Настройка push-уведомлений и напоминаний",
            icon: BellRingingIcon,
        },
        {
            name: "Безопасность",
            tab: "safety",
            desc: "Пароль, 2FA, вход в аккаунт и защита данных",
            icon: VaultIcon,
        },
        {
            name: "Приватность",
            tab: "private",
            desc: "Управление видимостью профиля и личных данных",
            icon: LockKeyIcon,
        },
    ];

    const accTab = {
        name: user.username ?? user.nick ?? "Аккаунт",
        desc: "",
        icon: UserIcon,
        tab: "acc",
    };

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
                            <input type="text" className="settingSearchInput" />
                            <MagnifyingGlassIcon size={20} />
                        </div>
                        <div
                            className="settingButt"
                            onClick={() => {
                                navigate(`/settings/${accTab}`);
                                setActiveTab(accTab)
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
                                Управление профилем и личными данными
                            </div>
                        </div>
                        <div className="settingsButtsWrapper">
                            {settings.map((s) => (
                                <div
                                    key={s.tab}
                                    className="settingButt"
                                    onClick={() => {
                                        setActiveTab(s)
                                        navigate(`/settings/${s.tab}`)
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
                                    navigate("/info")
                                }}
                            >
                                <span className="settingName">
                                    <InfoIcon size={24} weight="fill" />
                                    Информация
                                </span>
                                <div className="settingDesc">О проекте, политика конфиденциальности, Пользовательское соглашение, контакты, FAQ</div>
                            </div>
                        </div>
                    </div>
                    <div className="settingsPage">
                        {activeTab && (
                            <>
                                <div className="settingBack" onClick={() => {
                                    navigate(`/settings`)
                                    setActiveTab(null)
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
