import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, CopyIcon, DotsThreeIcon, PencilSimpleIcon, PlusIcon, TrashIcon, XIcon, StackIcon } from "@phosphor-icons/react";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { getCustomHex } from "../../../components/ts/utils/customPalette";
import { getBackgroundFilter } from "../../../components/ts/utils/backgroundFilter";
import { BackgroundScene, isStockScene } from "../../../components/ts/utils/BackgroundScene";
import BackIconsScene from "../../../components/ts/utils/BackIconsScene";
import WallpaperMark from "../../../components/ts/utils/WallpaperMark";
import { MAX_COMPOSITIONS, compositionCycleKey, type Composition, type CompositionAppearance, type CompositionRotation } from "../../../components/ts/utils/compositions";
import SelectList from "../../../components/ts/SelectList";
import HighlightText from "../../../components/ts/HighlightText";
import "../scss/compositions.scss";

const accents: Record<string, [string, string]> = {
    poison: ["#14b314", "#00ad09"], space: ["#8b12ee", "#a066ff"],
    apple: ["#ff3b3b", "#ff3333"], sky: ["#007bff", "#3399ff"],
    orange: ["#ff6b00", "#ff6b00"], inversion: ["#ffffff", "#ffffff"],
    abyss: ["#000000", "#000000"]
};
const gradients: Record<string, [string, string]> = {
    meadow: accents.poison, violet: accents.space, rubin: accents.apple,
    ocean: accents.sky, ginger: accents.orange,
    mono: accents.inversion, void: accents.abyss
};
const swatch = (name: string, palette: Record<string, [string, string]>,
    customHex: string, dark: boolean) => name === "custom" ? customHex :
        (palette[name] || accents.poison)[dark ? 0 : 1];
const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function CompositionPreview({ composition }: { composition: Composition }) {
    const appearance = composition.appearance;
    const dark = appearance.theme === "dark" ||
        (appearance.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const accent = swatch(appearance.accent, accents, appearance.customAccentHex, dark);
    const grad = swatch(appearance.grad, gradients, appearance.customGradHex, dark);
    const style = appearance.wallpaperStyle;
    const filled = appearance.bg === "color" || appearance.bg === "logo";
    const background = filled ? (style.fillMode === "gradient"
        ? `linear-gradient(135deg, ${style.fillColor}, ${style.fillGrad})` : style.fillColor)
        : `linear-gradient(145deg, ${dark ? "#17171d" : "#e7e7eb"}, ${accent}77, ${grad}77)`;
    const previewVars = {
        "--accent": accent, "--grad": grad,
        "--accent_text": accent, "--bgc": dark ? "#17171d" : "#e7e7eb",
        background
    } as CSSProperties;
    const effects = appearance.bgEffects;
    return <div className="compositionPreview" style={previewVars} aria-hidden="true">
        <div className="compositionPreviewCanvas" style={{ filter: getBackgroundFilter(effects, .16) }}>
            {appearance.bg === "custom" && !!appearance.bgUrl &&
                <img className="compositionPreviewPhoto" src={appearance.bgUrl} loading="lazy" alt=""/>}
            {isStockScene(appearance.bg) && <BackgroundScene variant={appearance.bg}
                artPattern={appearance.artPattern} artSize={appearance.artSize}/>}
            {appearance.bg === "default" && <BackIconsScene
                pattern={appearance.contourPattern} size={appearance.contourSize}/>}
            {filled && (appearance.bg === "logo" || style.logoEnabled) &&
                <WallpaperMark style={style}/>}
        </div>
        <div className={"compositionPreviewNav " + (dark ? "dark" : "light")}>
            <span style={{ background: accent }}/>
            <span/>
            <span/>
        </div>
        <div className={"compositionPreviewPanel " + (dark ? "dark" : "light")}>
            <div style={{ background: `linear-gradient(135deg, ${accent}, ${grad})` }}/>
            <span/>
            <span/>
        </div>
    </div>;
}

export default function CompositionsSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const {
        compositions, setCompositions, applyComposition,
        theme, accent, grad, decor, blur, layout, showMobileMenuOnStart, startupSideMenuTab,
        bg, bgUrl, bgEffects, wallpaperStyle,
        contourPattern, contourSize, artPattern, artSize
    } = useSettings();
    const [menuId, setMenuId] = useState<string | null>(null);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const current: CompositionAppearance = {
        theme, accent, grad, decor, blur, layout,
        showMobileMenuOnStart, startupSideMenuTab,
        bg, bgUrl, bgEffects, wallpaperStyle, contourPattern, contourSize, artPattern, artSize,
        customAccentHex: getCustomHex("accent"),
        customGradHex: getCustomHex("grad")
    };
    const labels = (key: string, vars?: Record<string, unknown>) =>
        t("compositions." + key, vars);
    const update = (edit: (current: typeof compositions) => typeof compositions) =>
        setCompositions(previous => edit(previous));
    const apply = (composition: Composition) => {
        applyComposition(composition.appearance);
        update(previous => ({
            ...previous, activeId: composition.id,
            lastCycleKey: compositionCycleKey(previous.mode, new Date())
        }));
        setMenuId(null);
    };
    const create = () => {
        if (compositions.items.length >= MAX_COMPOSITIONS) return;
        const unusedNumber = Array.from({ length: MAX_COMPOSITIONS }, (_, i) => i + 1)
            .find(i => !compositions.items.some(item => item.name === labels("defaultName", { count: i })));
        const id = crypto.randomUUID();
        const next: Composition = {
            id,
            name: labels("defaultName", { count: unusedNumber ?? compositions.items.length + 1 }),
            appearance: current
        };
        update(previous => ({
            ...previous, items: [...previous.items, next], activeId: id,
            lastCycleKey: compositionCycleKey(previous.mode, new Date())
        }));
        setRenameId(id);
        setName(next.name);
    };
    const duplicate = (item: Composition) => {
        if (compositions.items.length >= MAX_COMPOSITIONS) return;
        const id = crypto.randomUUID();
        update(previous => ({ ...previous, items: [...previous.items,
            { ...item, id, name: labels("copyName", { name: item.name }) }] }));
        setMenuId(null);
    };
    const overwrite = (item: Composition) => {
        update(previous => ({
            ...previous,
            items: previous.items.map(entry => entry.id === item.id ?
                { ...entry, appearance: current } : entry),
            activeId: item.id, lastCycleKey: compositionCycleKey(previous.mode, new Date())
        }));
        setMenuId(null);
    };
    const rename = () => {
        const next = name.trim().slice(0, 40);
        if (!renameId || !next) return;
        update(previous => ({ ...previous, items: previous.items.map(item =>
            item.id === renameId ? { ...item, name: next } : item) }));
        setRenameId(null);
    };
    const remove = () => {
        if (!deleteId) return;
        update(previous => ({
            ...previous,
            items: previous.items.filter(item => item.id !== deleteId),
            activeId: previous.activeId === deleteId ? null : previous.activeId,
            weekdays: previous.weekdays.map(id => id === deleteId ? null : id)
        }));
        setDeleteId(null);
        setMenuId(null);
    };

    useEffect(() => {
        if (!menuId) return;
        const close = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setMenuId(null);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenuId(null);
        };
        document.addEventListener("pointerdown", close);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", close);
            document.removeEventListener("keydown", escape);
        };
    }, [menuId]);

    const modes: { label: string; value: string }[] = [
        { value: "manual", label: labels("manual") },
        { value: "open", label: labels("onOpen") },
        { value: "daily", label: labels("daily") },
        { value: "weekly", label: labels("weekly") }
    ];
    const scheduleOptions = [
        { value: "", label: labels("noComposition") },
        ...compositions.items.map(item => ({ value: item.id, label: item.name }))
    ];

    return <div className="settingInnerDiv compositionsSettings" data-setting-id="compositions">
        <div className="settingHeader">
            <HighlightText text={labels("title")} search={search}/>
            <span className="compositionCount">{compositions.items.length}/{MAX_COMPOSITIONS}</span>
        </div>
        <div className="compositionContent">
            <p className="compositionDescription">{labels("description")}</p>
            <div className="compositionGrid">
                {compositions.items.map(item => {
                    const active = compositions.activeId === item.id;
                    const changed = active && JSON.stringify(current) !== JSON.stringify(item.appearance);
                    return <div key={item.id} className={"compositionCard" + (active ? " active" : "")}>
                        <button type="button" className="compositionCardApply"
                            onClick={() => apply(item)} title={labels("apply", { name: item.name })}
                            aria-label={labels("apply", { name: item.name })}>
                            <CompositionPreview composition={item}/>
                            <span className="compositionCardName">{item.name}</span>
                            {active && <span className="compositionCardActive">
                                <CheckCircleIcon size={16}/>
                                {changed ? labels("changed") : labels("active")}
                            </span>}
                        </button>
                        <div className="compositionMenuAnchor" ref={menuId === item.id ? menuRef : undefined}>
                            <button type="button" className="compositionMenuToggle"
                                aria-label={labels("actions", { name: item.name })}
                                aria-expanded={menuId === item.id}
                                onClick={() => setMenuId(previous => previous === item.id ? null : item.id)}>
                                <DotsThreeIcon size={20}/>
                            </button>
                            {menuId === item.id && <div className="compositionActions">
                                <button type="button" onClick={() => {
                                    setRenameId(item.id);
                                    setName(item.name);
                                    setMenuId(null);
                                }}><PencilSimpleIcon size={18}/>{labels("rename")}</button>
                                <button type="button" onClick={() => overwrite(item)}>
                                    <StackIcon size={18}/>{labels("overwrite")}
                                </button>
                                <button type="button" disabled={compositions.items.length >= MAX_COMPOSITIONS}
                                    onClick={() => duplicate(item)}>
                                    <CopyIcon size={18}/>{labels("duplicate")}
                                </button>
                                <button type="button" className="danger" onClick={() => {
                                    setDeleteId(item.id);
                                    setMenuId(null);
                                }}><TrashIcon size={18}/>{labels("remove")}</button>
                            </div>}
                        </div>
                    </div>;
                })}
                {compositions.items.length < MAX_COMPOSITIONS && <button type="button"
                    className="compositionCard compositionCreate" onClick={create}>
                    <PlusIcon size={24}/><span>{labels("saveCurrent")}</span>
                </button>}
            </div>
            {renameId && <div className="compositionInlineAction">
                <input type="text" value={name} maxLength={40} autoFocus
                    aria-label={labels("rename")} onChange={event => setName(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === "Enter") rename();
                        if (event.key === "Escape") setRenameId(null);
                    }}/>
                <button type="button" onClick={rename} disabled={!name.trim()}>{labels("save")}</button>
                <button type="button" className="compositionDismiss" onClick={() => setRenameId(null)}
                    aria-label={labels("cancel")}><XIcon size={20}/></button>
            </div>}
            {deleteId && <div className="compositionInlineAction">
                <span>{labels("confirmDelete", { name: compositions.items.find(item => item.id === deleteId)?.name })}</span>
                <button type="button" className="danger" onClick={remove}>{labels("remove")}</button>
                <button type="button" onClick={() => setDeleteId(null)}>{labels("cancel")}</button>
            </div>}
            <div className="compositionRotation">
                <div className="compositionRotationHeading">{labels("rotation")}</div>
                <SelectList className="compositionModePicker" arr={modes}
                    selected={compositions.mode} onChange={value => {
                        update(previous => ({ ...previous, mode: value as CompositionRotation,
                            lastCycleKey: null }));
                    }}/>
                <p className="compositionHint">{labels("modeHint_" + compositions.mode)}</p>
                {compositions.mode === "weekly" && <div className="compositionWeekdays">
                    {days.map((day, index) => <div key={day} className="compositionWeekday">
                        <span>{labels("day_" + day)}</span>
                        <SelectList className="compositionDayPicker" arr={scheduleOptions}
                            selected={compositions.weekdays[index] || ""}
                            onChange={value => update(previous => ({
                                ...previous,
                                weekdays: previous.weekdays.map((id, position) =>
                                    position === index ? value || null : id),
                                lastCycleKey: null
                            }))}/>
                    </div>)}
                </div>}
            </div>
            <p className="compositionLocalHint">{labels("localHint")}</p>
        </div>
    </div>;
}
