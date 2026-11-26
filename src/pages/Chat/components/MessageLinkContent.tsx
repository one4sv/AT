import { GearIcon, NewspaperIcon, SneakerMoveIcon, UserIcon, InfoIcon, DevicesIcon, KeyIcon, ImageIcon, WifiHighIcon } from "@phosphor-icons/react";
import SettingCatalogIcon from "../../Settings/components/SettingCatalogIcon";
import { useSearchableSettings } from "../../Settings/Arrays/searchableSettings";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { parseSettingLink, parseSettingNavigationLink, settingValueLabel, sharedSettings } from "../../Settings/Arrays/sharedSettings";
import { Fragment, type ReactNode } from "react";
import HighlightText from "../../../components/ts/HighlightText";
import SharedEntityCard from "./SharedEntityCard";
import { normalizeATLink, parseATPageLink } from "../utils/parseATPageLink";
import { parseATEntityLink } from "../utils/parseATEntityLink";

function SharedSettingIcon({ section, id }: { section: string; id: string }) {
    const catalog = useSearchableSettings(true);
    const group = catalog.find(entry => entry.id === section);
    const item = group?.items.find(entry => entry.id === id);
    const SectionIcon = group?.icon ?? GearIcon;
    return item ? <SettingCatalogIcon item={item} size={24} color="var(--inner_text)"/> : <SectionIcon size={22}/>;
}

function SharedSettingNavigationCard({ href, target }: { href: string; target: NonNullable<ReturnType<typeof parseSettingNavigationLink>> }) {
    const catalog = useSearchableSettings(true);
    const group = catalog.find(entry => entry.id === target.section);
    const item = group?.items.find(entry => entry.id === target.id);
    const { t } = useTranslation("settings");
    const navigate = useNavigate();
    const SectionIcon = group?.icon ?? GearIcon;
    // Old links may refer to a renamed setting. Keep a section card rather than raw URL.
    return <div className="sharedEntityCard">
        <a className="sharedEntityLink" href={href} onClick={event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            event.stopPropagation();
            navigate(target.pathname + target.search + new URL(href, window.location.origin).hash);
        }}>
            <span className="sharedEntityIcon">{item ? <SettingCatalogIcon item={item} size={24} color="var(--inner_text)"/> : <SectionIcon size={22}/>}</span>
            <span className="sharedEntityInfo">
                <span className="sharedEntityName">{item?.name ?? group?.name ?? t("settings.title")}</span>
                <span className="sharedEntityDetails">{item?.category ?? t("sharing.open")}</span>
            </span>
        </a>
    </div>;
}

function SharedATPageCard({ href, target }: { href: string; target: NonNullable<ReturnType<typeof parseATPageLink>> }) {
    const { t } = useTranslation("common");
    const { t: infoText } = useTranslation("info");
    const { t: settingsText } = useTranslation("settings");
    const navigate = useNavigate();
    const icons = { feed: NewspaperIcon, activities: SneakerMoveIcon, profile: UserIcon, connection: WifiHighIcon, info: InfoIcon, devices: DevicesIcon, password: KeyIcon, wallpapers: ImageIcon };
    const Icon = icons[target.kind];
    const title = target.kind === "info" ? (target.tab === "beta" ? infoText("beta.title") : target.tab ? infoText("info." + target.tab + ".name") : infoText("info.title")) :
        target.kind === "devices" ? settingsText("security.devices") :
        target.kind === "password" ? settingsText("security.changePassword") :
        target.kind === "wallpapers" ? settingsText("personalization.background") :
        t("chatUi.internalPages." + target.kind);
    return <div className="sharedEntityCard sharedEntityPage">
        <a className="sharedEntityLink" href={href} onClick={event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            event.stopPropagation();
            navigate(target.pathname + target.search + target.hash);
        }}>
            <span className="sharedEntityIcon"><Icon size={24}/></span>
            <span className="sharedEntityInfo">
                <span className="sharedEntityName">{title}</span>
                <span className="sharedEntityDetails">Achieve Together</span>
            </span>
        </a>
    </div>;
}

export default function MessageLinkContent({text,search}: {text:string;search:string}) {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();
    const nodes: ReactNode[] = [];
    let cursor = 0;
    const pattern = /(?:https?:\/\/|(?:www\.)?achievetogether\.vercel\.app(?=\/|\s|$))[^\s<>"']*/gi;
    for (const match of text.matchAll(pattern)) {
        const rawHref = match[0].replace(/[),.!?;:]+$/, "");
        const normalized = normalizeATLink(rawHref);
        if (!normalized) continue;
        const href = normalized.href;
        const reference = parseATEntityLink(href);
        const preset = parseSettingLink(href);
        const settingNavigation = parseSettingNavigationLink(href);
        const internalPage = parseATPageLink(href);
        if (!reference && !preset && !settingNavigation && !internalPage) continue;
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
        else if (settingNavigation) nodes.push(<SharedSettingNavigationCard key={"settingNavigation" + index} href={href} target={settingNavigation}/>);
        else if (reference) nodes.push(<SharedEntityCard key={"entity"+index} kind={reference.kind} id={reference.id} fallbackUrl={href}/>);
        else if (internalPage) nodes.push(<SharedATPageCard key={"page" + index} href={href} target={internalPage}/>);
        cursor = index + rawHref.length;
    }
    if (cursor === 0) return <HighlightText text={text} search={search}/>;
    if (cursor < text.length) nodes.push(<HighlightText key={"text"+cursor} text={text.slice(cursor)} search={search}/>);
    return <Fragment>{nodes}</Fragment>;
}
