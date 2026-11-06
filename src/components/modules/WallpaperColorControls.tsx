import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useSettings } from "../hooks/SettingsHook";
import { useBlackout } from "../hooks/BlackoutHook";
import ColorSelector from "../../pages/Settings/components/ColorSelector";
import Selector from "../ts/Selector";
import SeekBar from "../../pages/Settings/components/SeekBar";
import { Palette, Sun, Layers2 } from "lucide-react";
import type { WallpaperStyle } from "../context/SettingsContext";
import "./WallpaperColorControls.scss";

const swatches = ["#101018", "#303052", "#f5f2ff", "#916cf2", "#007bff", "#ff6b00", "#20b98d", "#ff3b3b"];

export default function WallpaperColorControls({ target }: { target: "fill" | "logo" }) {
    const { t } = useTranslation("settings");
    const { wallpaperStyle, setWallpaperStyle } = useSettings();
    const { setBlackout } = useBlackout();
    const modeKey = target === "logo" ? "logoMode" : "fillMode";
    const mainKey = target === "logo" ? "logoColor" : "fillColor";
    const gradKey = target === "logo" ? "logoGrad" : "fillGrad";
    const mode = wallpaperStyle[modeKey];
    const save = <K extends keyof WallpaperStyle>(key: K, value: WallpaperStyle[K]) => {
        setWallpaperStyle(previous => ({ ...previous, [key]: value }));
    };
    const colors = useMemo(() => [...new Set([...swatches, wallpaperStyle[mainKey], wallpaperStyle[gradKey]])]
        .map(value => ({ value, dark: value, light: value })), [wallpaperStyle[mainKey], wallpaperStyle[gradKey]]);

    return <div className="wallpaperColorControls">
        <div className="wallpaperColorHeading">
            {target === "logo" ? <Sun size={20}/> : <Layers2 size={20}/>}
            {t(target === "logo" ? "backgroundLibrary.logoFill" : "backgroundLibrary.backgroundFill")}
        </div>
        <Selector arr={[
            { value: "solid" as const, label: t("backgroundLibrary.solid"), func: value => save(modeKey, value) },
            { value: "gradient" as const, label: t("backgroundLibrary.gradient"), func: value => save(modeKey, value) }
        ]} selected={mode}/>
        <div className="colorSelector">
            <div className="colorTitle">{t(target === "logo" ? "backgroundLibrary.logoColor" : "backgroundLibrary.fillColor")}</div>
            <ColorSelector arr={colors} value={wallpaperStyle[mainKey]} setNew={value => save(mainKey, value)}/>
        </div>
        {mode === "gradient" && <div className="colorSelector">
            <div className="colorTitle">{t("backgroundLibrary.gradientColor")}</div>
            <ColorSelector arr={colors} value={wallpaperStyle[gradKey]} setNew={value => save(gradKey, value)}/>
        </div>}
        <button type="button" className="customPaletteOpen" onClick={() => setBlackout({
            seted: true, module: "CustomThemeColor",
            options: { id: target === "logo" ? "wallpaperLogoColors" : "wallpaperFillColors" }
        })}>
            <Palette size={20}/>
            {t("personalization.customColors")}
        </button>
        {target === "logo" && <div className="wallpaperColorGlow">
            <span><Sun size={19}/>{t("backgroundLibrary.logoGlow")}</span>
            <SeekBar id="wallpaperLogoGlow" min={0} max={100} step={5}
                value={wallpaperStyle.logoGlow} unit="%" disabled={false}
                onChange={value => save("logoGlow", value)}/>
        </div>}
    </div>;
}
