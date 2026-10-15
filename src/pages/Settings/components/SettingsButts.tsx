import { InfoIcon, UserIcon } from "@phosphor-icons/react";
import type { ElementType } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Setting } from "../Settings";

interface SettingsButtsProps {
  settings: Setting[];
  user: {
    username?: string | null;
    nick?: string | null;
    avatar_url?: string | null;
  };
  accTab: {
    name: string;
    desc: string;
    icon: ElementType;
    tab: string;
  };
  setActiveTab: (tab: Setting | null) => void;
}

export default function SettingsButts({
  settings,
  user,
  accTab,
  setActiveTab,
}: SettingsButtsProps) {
  const { t } = useTranslation("settings");
  const navigate = useNavigate();

  return (
    <div className="settingsButtsWrapper">
      {/* Кнопка аккаунта */}
      <div
        className="settingButt settingButtAcc"
        onClick={() => {
          navigate(`/settings/${accTab.tab}`);
          setActiveTab(accTab);
        }}
      >
        <span className="settingName">
          {user.avatar_url ? (
            <img className="settingAvatar" src={user.avatar_url} alt="" />
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
        <div className="settingDesc">{t("settings.accountDesc")}</div>
      </div>

      {/* Остальные настройки */}
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

      {/* Кнопка "Информация" */}
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
  );
}