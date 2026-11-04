import { useTranslation } from "react-i18next";
import type { ContourPattern } from "../../../../components/context/SettingsContext";
import "./ContourPatternPicker.scss";

export function ContourPatternPicker({ value, onChange }: {
    value: ContourPattern;
    onChange: (value: ContourPattern) => void;
}) {
    const { t } = useTranslation("settings");

    return <div className="settingInnerWrapper contourPatternPicker" data-setting-id="contourPattern">
        <div className="settingSpan">{t("backgroundLibrary.contourPattern")}</div>
        <div className="contourPatternChoices">
            <button type="button" className={value === "order" ? "active" : ""}
                onClick={() => onChange("order")} aria-pressed={value === "order"}>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <g stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="6" height="6" rx="1.5"/>
                        <rect x="13" y="3" width="6" height="6" rx="1.5"/>
                        <rect x="23" y="3" width="6" height="6" rx="1.5"/>
                        <rect x="3" y="13" width="6" height="6" rx="1.5"/>
                        <rect x="13" y="13" width="6" height="6" rx="1.5"/>
                        <rect x="23" y="13" width="6" height="6" rx="1.5"/>
                        <rect x="3" y="23" width="6" height="6" rx="1.5"/>
                        <rect x="13" y="23" width="6" height="6" rx="1.5"/>
                        <rect x="23" y="23" width="6" height="6" rx="1.5"/>
                    </g>
                </svg>
                {t("backgroundLibrary.order")}
            </button>
            <button type="button" className={value === "chaos" ? "active" : ""}
                onClick={() => onChange("chaos")} aria-pressed={value === "chaos"}>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <g stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="11" width="12" height="12" rx="2" transform="rotate(-22 9 17)"/>
                        <rect x="14" y="3" width="11" height="11" rx="2" transform="rotate(18 19.5 8.5)"/>
                        <rect x="14" y="15" width="13" height="13" rx="2" transform="rotate(37 20.5 21.5)"/>
                        <circle cx="12" cy="9" r="3.5"/>
                        <circle cx="24" cy="12" r="4"/>
                    </g>
                </svg>
                {t("backgroundLibrary.chaos")}
            </button>
        </div>
    </div>;
}
