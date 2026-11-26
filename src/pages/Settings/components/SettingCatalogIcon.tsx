import type { SearchableSetting } from "../Settings";
import AutoFitIconText from "./AutoFitIconText";
import "./SettingCatalogIcon.scss";

export default function SettingCatalogIcon({ item, size = 22, color }: { item: SearchableSetting; size?: number; color?: string }) {
    const Icon = item.icon;
    const Secondary = item.options?.icon2;
    return <span className="settingCatalogIcon" aria-hidden="true" style={{ minWidth: size, height: size }}>
        {Icon ? <Icon size={Secondary ? Math.round(size * .65) : size} weight="fill" color={color ?? item.options?.icon_color ?? "var(--accent)"}/> :
            <AutoFitIconText text={item.options?.icon_text}/>}
        {Secondary && <Secondary size={Math.round(size * .65)} weight="fill" color={color ?? item.options?.icon2_color ?? "var(--accent)"}/>}
    </span>;
}
