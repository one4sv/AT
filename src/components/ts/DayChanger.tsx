import { useTranslation } from "react-i18next";
import "../../scss/modules/habitFormControls.scss";
export default function DayChanger({
    chosenDays,
    toggleDay,
    showOnly,
    chosenArr
}: {
    chosenDays: { value: number; label: string; chosen: boolean }[];
    toggleDay: (value: number) => void;
    showOnly?: boolean | undefined;
    chosenArr?: number[] | null;
}) {
    const { t } = useTranslation("common");
    return (
        <div className="dayChanger">
            {chosenDays.map(({ value, chosen }) => {
                const wasChosen = chosenArr?.some(c => c === value);
                return (
                    <button
                        key={value}
                        onClick={() => toggleDay(value)}
                        disabled={!!showOnly}
                        className={chosen ? "active" : wasChosen ? "was" : ""}
                    >
                        {t(`habitUi.weekdays.${value}`)}
                    </button>
                );
            })}
        </div>
    );
}
