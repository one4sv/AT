import { useEffect, useState, type ElementType } from "react";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/settings.scss"
import { BellRingingIcon, CaretLeftIcon, ChatsTeardropIcon, GearIcon, LockKeyIcon, MagnifyingGlassIcon, PaintBucketIcon, SneakerMoveIcon, UserIcon, VaultIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import AccSettingsTab from "./components/SettingsTabs/AccSettingsTab";
import PersSettingsTab from "./components/SettingsTabs/PersSettingTab";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import { useAcc } from "../../components/hooks/AccHook";
import HabitsTab from "./components/SettingsTabs/HabitsTab";
import NotificationsTab from "./components/SettingsTabs/NotificationsTab";
import ChatsTab from "./components/SettingsTabs/ChatsTab";
import PrivacyTab from "./components/SettingsTabs/PrivacyTab";
import SecurityTab from "./components/SettingsTabs/SecurityTab";
import GeneralTab from "./components/SettingsTabs/GeneralTab";

export interface setting {
    name:string,
    tab:string,
    desc:string,
    icon:ElementType
}
export default function Settings() {
    const { setTitle } = usePageTitle();
    const { user, isAuthenticated, loadingUser } = useUser()
    const { setRed } = useSideMenu()
    const { setIsMyAcc } = useAcc()
    const [ activeTab, setActiveTab ] = useState<setting | null>(null);

    const navigate = useNavigate()

    useEffect(() => {
        if (!user && !loadingUser) navigate("/sign")
    }, [isAuthenticated, loadingUser, navigate, user])

    useEffect(() => {
        setTitle(`настройки`)
    }, [setTitle, user.nick])

    const settings:setting[] = [
        {name:"Общие", tab:"gen", desc:"Смена языка, экономия трафика и размер текста", icon:GearIcon},
        {name:"Персонализация", tab:"pers", desc:"Тема, внешний вид и оформление приложения", icon:PaintBucketIcon},
        {name:"Активности", tab:"habits", desc:"Порядок отображения активностей, архив и расписание недель", icon:SneakerMoveIcon},
        {name:"Чаты", tab:"chats", desc:"Сообщения, группы и параметры общения", icon:ChatsTeardropIcon},
        {name:"Уведомления", tab:"notes", desc:"Настройка push-уведомлений и напоминаний", icon:BellRingingIcon},
        {name:"Безопасность", tab:"safety", desc:"Пароль, 2FA, вход в аккаунт и защита данных", icon:VaultIcon},
        {name:"Приватность", tab:"private", desc:"Управление видимостью профиля и личных данных", icon:LockKeyIcon},
    ]

    const accTab = {name:user.username ?? user.nick ?? "Аккаунт",desc:"", icon:UserIcon, tab:"acc" }

    const tabs = {
        gen: <GeneralTab />,
        acc: <AccSettingsTab />,
        pers: <PersSettingsTab />,
        habits: <HabitsTab />,
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
                        transform: activeTab ? "translateX(-50%)" : "translateX(0)"
                    }}
                >
                    <div className="settingsPage">
                        <div className="settingSearch">
                            <input type="text" className="settingSearchInput"/>
                            <MagnifyingGlassIcon size={20}/>
                        </div>
                        <div className="settingButt"
                            onClick={() => {
                                setActiveTab(accTab)
                                setRed(true)
                                setIsMyAcc(true)
                            }}>
                            <span className="settingName">
                                {user.avatar_url ? (
                                    <img
                                        className="settingAvatar"
                                        src={user.avatar_url}
                                    />
                                ) : (
                                    <div className="settingAvatar">
                                        <UserIcon size={28} weight="fill" />
                                    </div>
                                )}
                                {user.username ?(
                                    <>
                                    <span className="settingUserName">{user.username}</span> <span className="settingUserNick">| @{user.nick}</span>
                                    </>
                                ) : (
                                    <>
                                        @{user.nick}
                                    </>
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
                                    onClick={() => setActiveTab(s)}
                                >
                                    <span className="settingName">
                                        <s.icon size={24} weight="fill"/>
                                        {s.name}
                                    </span>
                                    <div className="settingDesc">
                                        {s.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="settingsPage">
                        {activeTab && (
                            <>
                                <div className="settingBack" onClick={() => setActiveTab(null)}>
                                    <CaretLeftIcon size={24}/> 
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