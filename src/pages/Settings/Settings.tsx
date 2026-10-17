import { useEffect, useState, type ElementType } from "react";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/settings.scss";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XIcon,
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
import { isMobile } from "react-device-detect";
import { useSettingsTabs } from "./Arrays/settingsTabs";
import SettingsButts from "./components/SettingsButts";
import SearchUnstarted from "./components/Search/SearchUnstarted";
import SearchedButts from "./components/Search/SearchedButts";
import { AnimatePresence, motion } from "motion/react";

export interface Setting {
  name: string;
  tab: string;
  desc: string;
  icon: ElementType;
}

export interface SearchableSetting {
  id: string;
  name: string;
  icon: ElementType | null;
  category: string;
  options?: {
    icon2?: ElementType;
    icon_color?: string;
    icon2_color?: string;
    icon_text?:string;
    isDanger?:boolean;
  };
}

export default function Settings() {
  const { t } = useTranslation("settings");
  const { setTitle } = usePageTitle();
  const { user, isAuthenticated, loadingUser } = useUser();
  const { setIsMyAcc } = useAcc();

  const { tab } = useParams();
  const navigate = useNavigate();
  const settings = useSettingsTabs();

  const [activeTab, setActiveTab] = useState<Setting | null>(null);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (!user.id && !loadingUser) {
      navigate("/sign");
    }
  }, [isAuthenticated, loadingUser, navigate, user]);

  useEffect(() => {
    setTitle(tab && activeTab !== null ? activeTab.name : t("settings.title"));
    setIsMyAcc(true);
  }, [setIsMyAcc, setTitle, user.nick, t, tab, activeTab]);

  const accTab = {
    name: user.username ?? user.nick ?? t("settings.account"),
    desc: t("settings.accountDesc"),
    icon: UserIcon,
    tab: "acc",
  };

  useEffect(() => {
    if (tab) {
      if (tab === "acc") setActiveTab(accTab);
      else setActiveTab(settings.find((s) => s.tab === tab) ?? null);
    }
  }, [tab, t]);

  const tabs = {
    gen: <GeneralTab />,
    acc: <AccSettingsTab />,
    pers: <PersSettingsTab />,
    activities: <HabitsTab />,
    chats: <ChatsTab />,
    notes: <NotificationsTab />,
    safety: <SecurityTab />,
    private: <PrivacyTab />,
  };

  const settingSearch = () => (
    <div className="settingSearch">
      <input
        type="text"
        className="settingSearchInput"
        placeholder="Поиск..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
      />
      <div onClick={() => setSearch("")}>
        {search.trim() !== "" ? <XIcon /> : <MagnifyingGlassIcon />}
      </div>
    </div>
  );

  const contentKey =
    search.trim() !== ""
      ? "searched"
      : isSearchFocused
        ? "unstarted"
        : "butts";

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
            {!isMobile && <div className="settingTop">{settingSearch()}</div>}
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                initial={{ y: 18, scale: 0.97 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: -18, scale: 0.97 }}
                transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {contentKey === "searched" && <SearchedButts search={search}/>}
                {contentKey === "unstarted" && <SearchUnstarted />}
                {contentKey === "butts" && (
                  <SettingsButts
                    settings={settings}
                    user={user}
                    accTab={accTab}
                    setActiveTab={setActiveTab}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            {isMobile && (
              <div className="settingBackWrapper">{settingSearch()}</div>
            )}
          </div>

          <div className="settingsPage">
            {activeTab && (
              <>
                {!isMobile && (
                  <div className="settingTop">
                    <div
                      className="settingBack"
                      onClick={() => navigate(`/settings`)}
                    >
                      <ArrowLeftIcon />
                    </div>
                    {settingSearch()}
                  </div>
                )}

                {tabs[activeTab.tab as keyof typeof tabs]}

                {isMobile && (
                  <div className="settingBackWrapper">
                    <div  
                      className="settingBack"
                      onClick={() => navigate(`/settings`)}
                    >
                      <ArrowLeftIcon />
                    </div>
                    {settingSearch()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}