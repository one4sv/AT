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
    return (
        <div className="dayChanger">
            {chosenDays.map(({ value, label, chosen }) => {
                const wasChosen = chosenArr?.some(c => c === value);
                return (
                    <button
                        key={value}
                        onClick={() => toggleDay(value)}
                        disabled={!!showOnly}
                        className={chosen ? "active" : wasChosen ? "was" : ""}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
