import { useRef, useState, type CSSProperties } from "react";
import { ArrowsOutIcon, CheckCircleIcon, PlusCircleIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import BackIconsScene from "../ts/utils/BackIconsScene";
import { getBackgroundFilter } from "../ts/utils/backgroundFilter";
import Selector from "../ts/Selector";
import { BackgroundScene, type StockScene, isStockScene, supportsBackgroundMotion } from "../ts/utils/BackgroundScene";
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
    const { bg, bgUrl, bgGallery, bgEffects, setBgEffects, settingsLoaded, refetchSettings } = useSettings();
    const { setNewBg } = useUpSettings();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [ tab, setTab ] = useState<"stock" | "custom">("stock");
    const [ saving, setSaving ] = useState(false);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const previewStyle = { filter: getBackgroundFilter(bgEffects, .24) };
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

    const previewBackground = (id: string, url?: string) => {
        if (saving) return;
        setBlackout({ seted: true, module: "BackgroundFullscreen", options: { id, url } });
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

    const stockGroups = [
        { id: "essential", items: [
            { id: "landing", label: t("personalization.landingBackground") },
            { id: "default", label: t("personalization.contourShapes") },
            { id: "color", label: t("personalization.solidColor") }
        ] },
        { id: "atmospheric", items: [
            { id: "aurora", label: t("backgroundLibrary.aurora") },
            { id: "nebula", label: t("backgroundLibrary.nebula") },
            { id: "sunset", label: t("backgroundLibrary.sunset") },
            { id: "waves", label: t("backgroundLibrary.waves") },
            { id: "petals", label: t("backgroundLibrary.petals") }
        ] },
        { id: "retro", items: [
            { id: "retroDrive", label: t("backgroundLibrary.retroDrive") },
            { id: "neonCity", label: t("backgroundLibrary.neonCity") },
            { id: "laser", label: t("backgroundLibrary.laser") },
            { id: "orbit", label: t("backgroundLibrary.orbit") },
            { id: "glitch", label: t("backgroundLibrary.glitch") }
        ] },
        { id: "abstract", items: [
            { id: "art", label: t("backgroundLibrary.art") },
            { id: "paintSplash", label: t("backgroundLibrary.paintSplash") },
            { id: "liquid", label: t("backgroundLibrary.liquid") },
            { id: "prism", label: t("backgroundLibrary.prism") }
        ] }
    ];

    const selectStock = (id: string) => {
        if (saving) return;
        setNewBg(id);

        if (!supportsBackgroundMotion(id) || bgEffects.movement) return;

        const next = { ...bgEffects, movement: true };
        setBgEffects(next);
        void api.post("updatesettings", { bg_effects: next }).then(res => {
            if (!res.data?.success) throw new Error();
        }).catch(() => {
            showNotification("error", t("backgroundLibrary.error"));
            void refetchSettings();
        });
    };

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
                ) : tab === "stock" ? (
                    <div className="backgroundLibrarySections">
                        {stockGroups.map(group => (
                            <section className="backgroundLibrarySection" key={group.id}>
                                <div className="backgroundLibrarySectionTitle">{t(`backgroundLibrary.${group.id}`)}</div>
                                <div className="backgroundLibraryGrid">
                                    {group.items.map(item => (
                                        <div key={item.id}
                                            className={`bgPick backgroundLibraryTile ${bg === item.id ? "active" : ""}`}>
                                            <button type="button" className="backgroundLibraryChoose"
                                                onClick={() => selectStock(item.id)}>
                                                {item.id === "landing" ?
                                                <div className="bgImg bgMini landingBackground" style={previewStyle}/> :
                                                item.id === "default" ?
                                                    <div className="bgImg bgMini" style={previewStyle}><BackIconsScene/></div> :
                                                    isStockScene(item.id) ?
                                                        <div className="bgImg bgMini" style={{ ...previewStyle, "--scene-duration": `${18 / Math.max(.25, Math.min(3, bgEffects.speed ?? 1))}s` } as CSSProperties}>
                                                            <BackgroundScene variant={item.id as StockScene} motion={supportsBackgroundMotion(item.id) && (bgEffects.speed ?? 1) > 0}/>
                                                        </div> :
                                                        <div className="bgImg bgMini" style={previewStyle}/>}
                                                <span className={bg === item.id ? "bgSpanChoosen" : ""}>{item.label}</span>
                                                {bg === item.id && <CheckCircleIcon className="backgroundLibraryCheck" size={20} weight="fill"/>}
                                            </button>
                                            <button type="button" className="backgroundLibraryPreview"
                                                aria-label={t("backgroundLibrary.preview")} title={t("backgroundLibrary.preview")}
                                                onClick={() => previewBackground(item.id)}>
                                                <ArrowsOutIcon size={20}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="backgroundLibraryGrid">
                        {bgGallery.map(item => (
                            <div key={item.url} className={`bgPick backgroundLibraryTile ${bg === "custom" && bgUrl === item.url ? "active" : ""}`}>
                                <button type="button" className="backgroundLibraryChoose" disabled={saving}
                                    onClick={() => void selectCustom(item.url)}>
                                    <CustomBackgroundThumb url={item.url}/>
                                     {bg === "custom" && bgUrl === item.url && <CheckCircleIcon className="backgroundLibraryCheck" size={20} weight="fill"/>}
                                </button>
                                <button type="button" className="backgroundLibraryDelete"
                                    disabled={saving} aria-label={t("backgroundLibrary.delete")}
                                    onClick={() => deleteCustom(item.url)}>
                                    <TrashIcon size={19}/>
                                </button>
                                <button type="button" className="backgroundLibraryPreview"
                                    disabled={saving} aria-label={t("backgroundLibrary.preview")}
                                    title={t("backgroundLibrary.preview")}
                                    onClick={() => previewBackground("custom", item.url)}>
                                    <ArrowsOutIcon size={20}/>
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
