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
import { useMotionValue, animate } from "motion/react";

export interface Setting {
  name: string;
  tab: string;
  desc: string;
  icon: ElementType;
}

export interface SearchableSetting {
  id: string;
  name: string;
  desc: string;
  tab: string;
  icon: ElementType;
  category: string;
}

export default function Settings() {
  const { t } = useTranslation("settings");
  const { setTitle, setHideHeader } = usePageTitle();
  const { user, isAuthenticated, loadingUser } = useUser();
  const { setIsMyAcc } = useAcc();

  const { tab } = useParams();
  const navigate = useNavigate();
  const settings = useSettingsTabs();

  const [activeTab, setActiveTab] = useState<Setting | null>(null);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchProgress = useMotionValue(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsub = searchProgress.on("change", (v) => setProgress(v));
    return unsub;
  }, [searchProgress]);

  useEffect(() => {
    const target = isSearchFocused ? 1 : 0;
    const controls = animate(searchProgress, target, {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [isSearchFocused, searchProgress]);

  useEffect(() => {
    if (!user.id && !loadingUser) {
      navigate("/sign");
    }
  }, [isAuthenticated, loadingUser, navigate, user]);

  useEffect(() => {
    setTitle(tab && activeTab !== null ? activeTab.name : t("settings.title"));
    setIsMyAcc(true);
  }, [setIsMyAcc, setTitle, user.nick, t, tab, activeTab]);

  useEffect(() => {
    if (isSearchFocused) setHideHeader(true);
    else setHideHeader(false);
  }, [isSearchFocused]);

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

  const searchContent =
    search.trim() !== "" ? (
      <SearchedButts search={search} />
    ) : (
      <SearchUnstarted />
    );

  // Правильный bottom: 0 → calc(100% - 6.5vh)
  const searchBottom =
    progress <= 0
      ? "0px"
      : `calc(${progress * 100}% - ${progress * 6.5}vh)`;

  return (
    <div className="settingsDiv">
      <div className="settingsSliderWrapper">
        <div
          className="settingsSlider"
          style={{
            transform: tab ? "translateX(-50%)" : "translateX(0)",
          }}
        >
          {/* ========== Левая страница ========== */}
          <div className="settingsPage">
            {!isMobile && <div className="settingTop">{settingSearch()}</div>}

            <div className="settingsContentWipe">
              <div
                className="buttsCollapse"
                style={{
                  height: `${(1 - progress) * 100}%`,
                }}
              >
                <div className="buttsScroll">
                  <SettingsButts
                    settings={settings}
                    user={user}
                    accTab={accTab}
                    setActiveTab={setActiveTab}
                  />
                </div>
              </div>

              <div className="searchReveal">
                {searchContent}
              </div>
            </div>

            {isMobile && (
              <div
                className={`settingBackWrapper ${
                  progress > 0.5 ? "searchFocused" : ""
                } ${progress > 0.01 && progress < 0.99 ? "isMoving" : ""}`}
                style={{
                  bottom: searchBottom,
                  paddingTop: progress > 0.5 ? "1.5vh" : "0px",
                  paddingBottom: progress > 0.5 ? "0px" : "3vh",
                }}
              >
                {settingSearch()}
              </div>
            )}
          </div>

          {/* ========== Правая страница ========== */}
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