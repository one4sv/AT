import { useRef, useState } from "react";
import { CheckCircleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import SeekBar from "../../pages/Settings/components/SeekBar";
import Toggler from "../ts/Toggler";
import "./BackgroundLibrary.scss";

export default function BackgroundLibrary() {
    const { t } = useTranslation("settings");
    const { bg, bgUrl, bgGallery, bgEffects, setBgEffects, refetchSettings } = useSettings();
    const { setNewBg } = useUpSettings();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [ tab, setTab ] = useState<"stock" | "custom">("stock");
    const [ saving, setSaving ] = useState(false);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const effectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setEffects = (next: typeof bgEffects) => {
        setBgEffects(next);
        if (effectTimer.current) clearTimeout(effectTimer.current);
        effectTimer.current = setTimeout(async () => {
            try {
                const res = await api.post("updatesettings", { bg_effects: next });
                if (!res.data?.success) throw new Error();
            } catch {
                showNotification("error", t("backgroundLibrary.error"));
                void refetchSettings();
            }
        }, 400);
    };

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
        { id: "color", label: t("personalization.solidColor") }
    ];

    const filters = ["none", "grayscale", "sepia", "invert", "contrast", "saturate"] as const;

    return (
        <div className="backgroundLibraryModal" role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.title")}>
            <div className="backgroundLibraryTitle">{t("backgroundLibrary.title")}</div>
            <div className="backgroundLibraryTabs">
                <button type="button" className={tab === "stock" ? "active" : ""} onClick={() => setTab("stock")}>
                    {t("backgroundLibrary.stock")}
                </button>
                <button type="button" className={tab === "custom" ? "active" : ""} onClick={() => setTab("custom")}>
                    {t("backgroundLibrary.custom")} ({bgGallery.length}/5)
                </button>
            </div>
            <div className="backgroundLibraryScroll">
                <div className="backgroundLibraryGrid">
                    {tab === "stock" && stock.map(item => (
                        <button type="button" key={item.id}
                            className={`backgroundLibraryTile ${bg === item.id ? "active" : ""}`}
                            onClick={() => setNewBg(item.id)}>
                            <span className={`backgroundLibraryThumb backgroundThumb-${item.id}`}/>
                            <span>{item.label}</span>
                            {bg === item.id && <CheckCircleIcon weight="fill" size={20}/>}
                        </button>
                    ))}
                    {tab === "custom" && bgGallery.map(item => (
                        <div className={`backgroundLibraryTile ${bg === "custom" && bgUrl === item.url ? "active" : ""}`}
                            key={item.url}>
                            <button type="button" className="backgroundLibraryChoose" disabled={saving}
                                onClick={() => void selectCustom(item.url)}>
                                <img src={item.url} alt={t("personalization.yourBg")}/>
                                <span>{bg === "custom" && bgUrl === item.url ?
                                    t("backgroundLibrary.selected") : t("personalization.yourBg")}</span>
                                {bg === "custom" && bgUrl === item.url && <CheckCircleIcon weight="fill" size={20}/>}
                            </button>
                            <button type="button" className="backgroundLibraryDelete" disabled={saving}
                                onClick={() => deleteCustom(item.url)} aria-label={t("backgroundLibrary.delete")}>
                                <TrashIcon size={19}/>
                            </button>
                        </div>
                    ))}
                </div>
                {tab === "custom" && <>
                    {bgGallery.length < 5 ? <>
                        <button type="button" className="backgroundLibraryAdd" onClick={() => fileRef.current?.click()}>
                            <PlusIcon/>{t("backgroundLibrary.add")}
                        </button>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            hidden onChange={event => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) setBlackout({ seted: true, module: "BgHandler", bg: file });
                            }}/>
                    </> : <div className="settingHint">{t("backgroundLibrary.limit")}</div>}
                    {!bgGallery.length && <div className="settingHint">{t("backgroundLibrary.empty")}</div>}
                </>}
                <div className="backgroundLibraryEffects">
                    <div className="backgroundLibraryLabel">{t("backgroundLibrary.blur")}: {bgEffects.blur}px</div>
                    <SeekBar id="backgroundBlur" min={0} max={30} value={bgEffects.blur}
                        onChange={value => setEffects({ ...bgEffects, blur: value })} disabled={false} step={1}/>
                    <div className="backgroundLibraryToggle" onClick={() => setEffects({ ...bgEffects, movement: !bgEffects.movement })}>
                        {t("backgroundLibrary.movement")} <Toggler state={bgEffects.movement}/>
                    </div>
                    <div className="backgroundLibraryLabel">{t("backgroundLibrary.filter")}</div>
                    <div className="backgroundLibraryFilters">
                        {filters.map(filter => (
                            <button type="button" key={filter} className={bgEffects.filter === filter ? "active" : ""}
                                onClick={() => setEffects({ ...bgEffects, filter })}>
                                {t(`backgroundLibrary.${filter}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
