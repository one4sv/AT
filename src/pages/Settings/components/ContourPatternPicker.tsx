import { useTranslation } from "react-i18next";
import type { ContourPattern } from "../../../components/context/SettingsContext";
import Selector from "../../../components/ts/Selector";
import SeekBar from "./SeekBar";
import "../scss/ContourPatternPicker.scss";

function OrderIcon({ size = 20 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1.8">
            {[3, 13, 23].flatMap(x => [3, 13, 23].map(y =>
                <rect key={x + "-" + y} x={x} y={y} width="6" height="6" rx="1.5"/>))}
        </g>
    </svg>;
}

function ChaosIcon({ size = 20 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="12" height="12" rx="2" transform="rotate(-22 9 17)"/>
            <rect x="14" y="3" width="11" height="11" rx="2" transform="rotate(18 19.5 8.5)"/>
            <rect x="14" y="15" width="13" height="13" rx="2" transform="rotate(37 20.5 21.5)"/>
            <circle cx="12" cy="9" r="3.5"/>
        </g>
    </svg>;
}

export function ContourPatternPicker({ value, onChange, size = 1, onSizeChange, subject = "contour" }: {
    value: ContourPattern;
    onChange: (value: ContourPattern) => void;
    size?: number;
    onSizeChange?: (size: number) => void;
    subject?: "contour" | "art";
}) {
    const { t } = useTranslation("settings");
    const items = [
        { value: "order" as const, label: t("backgroundLibrary.order"), icon: OrderIcon, func: onChange },
        { value: "chaos" as const, label: t("backgroundLibrary.chaos"), icon: ChaosIcon, func: onChange }
    ];

    return <div className="settingInnerWrapper contourPatternPicker" data-setting-id="contourPattern">
        <div className="settingSpan">{t(subject === "art" ? "backgroundLibrary.artPattern" : "backgroundLibrary.contourPattern")}</div>
        <Selector arr={items} selected={value}/>
        {onSizeChange && <>
            <div className="settingSpan">{t(subject === "art" ? "backgroundLibrary.artSize" : "backgroundLibrary.contourSize")}</div>
            <SeekBar id="contourSize" min={.5} max={1.5} step={.05}
                value={size} unit="×" disabled={false} onChange={onSizeChange}/>
        </>}
    </div>;
}
