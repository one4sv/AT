import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useSettingsTabs } from "../../../../pages/Settings/Arrays/settingsTabs";

export default function SettingsBackMenu() {
    const { t } = useTranslation("settings");
    const navigate = useNavigate();
    const { closeMenu, menu } = useContextMenu();
    const settings = useSettingsTabs();
    return (
        <>
            {settings.filter(item => item.tab !== menu.options.id).map(item => (
                <div key={item.tab} className="ContextMenuButt" onClick={() => {
                    closeMenu();
                    navigate(`/settings/${item.tab}`);
                }}>
                    <item.icon weight="fill"/>
                    {item.name}
                </div>
            ))}
            <div className="ContextMenuButt" onClick={() => {
                closeMenu();
                navigate("/settings");
            }}>{t("settings.title")}</div>
        </>
    );
}
