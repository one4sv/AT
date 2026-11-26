import { GearIcon } from "@phosphor-icons/react";
import SettingCatalogIcon from "../../Settings/components/SettingCatalogIcon";
import { useSearchableSettings } from "../../Settings/Arrays/searchableSettings";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { parseSettingLink, settingValueLabel, sharedSettings } from "../../Settings/Arrays/sharedSettings";
import { Fragment, type ReactNode } from "react";
import HighlightText from "../../../components/ts/HighlightText";
import SharedEntityCard from "./SharedEntityCard";
import { parseATEntityLink } from "../utils/parseATEntityLink";

function SharedSettingIcon({ section, id }: { section: string; id: string }) {
    const catalog = useSearchableSettings(true);
    const item = catalog.find(group => group.id === section)?.items.find(entry => entry.id === id);
    return item ? <SettingCatalogIcon item={item} size={24}/> : <GearIcon size={22}/>;
}

export default function MessageLinkContent({text,search}: {text:string;search:string}) {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();
    const nodes: ReactNode[] = [];
    let cursor = 0;
    const pattern = /https?:\/\/[^\s<>"']+/gi;
    for (const match of text.matchAll(pattern)) {
        const href = match[0].replace(/[),.!?;:]+$/, "");
        const reference = parseATEntityLink(href);
        const preset = parseSettingLink(href);
        if (!reference && !preset) continue;
        const index = match.index ?? 0;
        if (index > cursor) nodes.push(<HighlightText key={"text"+cursor} text={text.slice(cursor,index)} search={search}/>);
        if (preset) nodes.push(
            <div className="sharedEntityCard" key={"setting" + index}>
                <a className="sharedEntityLink" href={href} onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setBlackout({ seted: true, module: "SharedSettingPreview", options: { url: href } });
                }}>
                    <span className="sharedEntityIcon"><SharedSettingIcon section={sharedSettings[preset.setting].section} id={sharedSettings[preset.setting].id}/></span>
                    <span className="sharedEntityInfo">
                        <span className="sharedEntityName">{t(sharedSettings[preset.setting].title)}</span>
                        <span className="sharedEntityDetails">{settingValueLabel(preset.setting, preset.value, t)}</span>
                    </span>
                </a>
            </div>
        );
        else if (reference) nodes.push(<SharedEntityCard key={"entity"+index} kind={reference.kind} id={reference.id} fallbackUrl={href}/>);
        cursor = index + href.length;
    }
    if (cursor === 0) return <HighlightText text={text} search={search}/>;
    if (cursor < text.length) nodes.push(<HighlightText key={"text"+cursor} text={text.slice(cursor)} search={search}/>);
    return <Fragment>{nodes}</Fragment>;
}
