import { useRef, useState } from "react";
import { CheckCircleIcon, PlusCircleIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { useBackIconsPattern } from "../hooks/utils/useBackIconsPattern";
import Selector from "../ts/Selector";
import { BackgroundScene, type StockScene } from "../ts/utils/BackgroundScene";
import { api } from "../ts/api";
import "./BackgroundLibrary.scss";
import "../../scss/Loading.scss";

function CustomBackgroundThumb({ url }: { url: string }) {
    const [ loaded, setLoaded ] = useState(false);

    return (
        <div className="bgMini bgImg backgroundCustomThumb">
            {!loaded && <div className="skeletonBlock" aria-hidden="true"/>}
            <img src={url} alt="" loading="lazy"
                className={loaded ? "loaded" : ""}
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}/>
        </div>
    );
}

export default function BackgroundLibrary() {
    const { t } = useTranslation("settings");
    const { bg, bgUrl, bgGallery, settingsLoaded, refetchSettings } = useSettings();
    const { setNewBg } = useUpSettings();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [ tab, setTab ] = useState<"stock" | "custom">("stock");
    const [ saving, setSaving ] = useState(false);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const backIconsPattern = useBackIconsPattern({
        width: 160,
        height: 90,
        minSize: 26,
        maxSize: 45
    });

    const tabs = [
        { value: "stock" as const, label: t("backgroundLibrary.stock"), func: setTab },
        { value: "custom" as const, label: `${t("backgroundLibrary.custom")} (${bgGallery.length}/6)`, func: setTab }
    ];

    const selectCustom = async (url: string) => {
        if (saving) return;
        setSaving(true);
        try {
            const res = await api.post("backgrounds/select", { url });
            if (!res.data?.success) throw new Error();
            setNewBg("custom");
            await refetchSettings();
        } catch {
            showNotification("error", t("backgroundLibrary.error"));
        } finally {
            setSaving(false);
        }
    };

    const deleteCustom = (url: string) => {
        if (saving) return;
        setBlackout({ seted: true, module: "ConfirmAction", confirmAction: {
            title: t("backgroundLibrary.deleteQuestion"),
            description: t("backgroundLibrary.deleteHint"),
            label: t("backgroundLibrary.delete"),
            run: async () => {
                const res = await api.post("backgrounds/delete", { url });
                if (!res.data?.success) throw new Error();
                if (bg === "custom" && bgUrl === url && !res.data.bg_url) setNewBg("landing");
                await refetchSettings();
            }
        } });
    };

    const stock = [
        { id: "landing", label: t("personalization.landingBackground") },
        { id: "default", label: t("personalization.contourShapes") },
        { id: "color", label: t("personalization.solidColor") },
        { id: "art", label: t("backgroundLibrary.art") },
        { id: "aurora", label: t("backgroundLibrary.aurora") },
        { id: "nebula", label: t("backgroundLibrary.nebula") },
        { id: "sunset", label: t("backgroundLibrary.sunset") }
    ];

    return (
        <div className="backgroundLibraryModal" role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.title")}>
            <div className="backgroundLibraryTitle">{t("backgroundLibrary.title")}</div>
            <Selector arr={tabs} selected={tab}/>
            <div className="backgroundLibraryScroll" key={tab}>
                {tab === "custom" && bgGallery.length < 6 && settingsLoaded && (
                    <button type="button" className="backgroundLibraryAdd" onClick={() => fileRef.current?.click()}>
                        <PlusCircleIcon size={24} weight="fill"/>
                        {t("backgroundLibrary.add")}
                    </button>
                )}
                {tab === "custom" && <input ref={fileRef} type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden
                    onChange={event => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) setBlackout({ seted: true, module: "BgHandler", bg: file });
                    }}/>}
                {!settingsLoaded ? (
                    <div className="backgroundLibraryGrid" role="status" aria-busy="true" aria-label={t("post.loading")}>
                        {Array.from({ length: tab === "custom" ? 2 : 3 }, (_, i) => (
                            <div className="backgroundLibrarySkeleton" key={i}>
                                <div className="skeletonBlock"/>
                                <div className="skeletonLine skeletonShort"/>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="backgroundLibraryGrid">
                        {tab === "stock" && stock.map(item => (
                            <button type="button" key={item.id}
                                className={`bgPick backgroundLibraryTile ${bg === item.id ? "active" : ""}`}
                                onClick={() => setNewBg(item.id)}>
                                {item.id === "landing" ?
                                    <div className="bgImg bgMini landingBackground"/> :
                                    item.id === "default" ?
                                        <div className="bgImg bgMini">{backIconsPattern}</div> :
                                        ["art", "aurora", "nebula", "sunset"].includes(item.id) ?
                                        <div className="bgImg bgMini"><BackgroundScene variant={item.id as StockScene}/></div> :
                                        <div className="bgImg bgMini"/>}
                                <span className={bg === item.id ? "bgSpanChoosen" : ""}>{item.label}</span>
                                {bg === item.id && <CheckCircleIcon className="backgroundLibraryCheck" size={20} weight="fill"/>}
                            </button>
                        ))}
                        {tab === "custom" && bgGallery.map(item => (
                            <div key={item.url} className={`bgPick backgroundLibraryTile ${bg === "custom" && bgUrl === item.url ? "active" : ""}`}>
                                <button type="button" className="backgroundLibraryChoose" disabled={saving}
                                    onClick={() => void selectCustom(item.url)}>
                                    <CustomBackgroundThumb url={item.url}/>
                                    <span className={bg === "custom" && bgUrl === item.url ? "bgSpanChoosen" : ""}>
                                        {t("backgroundLibrary.change")}
                                    </span>
                                    {bg === "custom" && bgUrl === item.url && <CheckCircleIcon className="backgroundLibraryCheck" size={20} weight="fill"/>}
                                </button>
                                <button type="button" className="backgroundLibraryDelete"
                                    disabled={saving} aria-label={t("backgroundLibrary.delete")}
                                    onClick={() => deleteCustom(item.url)}>
                                    <TrashIcon size={19}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {tab === "custom" && settingsLoaded && bgGallery.length >= 6 &&
                    <div className="settingHint">{t("backgroundLibrary.limit")}</div>}
                {tab === "custom" && settingsLoaded && !bgGallery.length &&
                    <div className="settingHint">{t("backgroundLibrary.empty")}</div>}
            </div>
        </div>
    );
}
