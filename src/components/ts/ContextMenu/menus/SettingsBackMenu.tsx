import { useNavigate } from "react-router";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useSettingsTabs } from "../../../../pages/Settings/Arrays/settingsTabs";

export default function SettingsBackMenu() {
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
        </>
    );
}
