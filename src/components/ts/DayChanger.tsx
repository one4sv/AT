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
                const isChosen = chosenArr?.some(c => c === value) || chosen;
                return (
                    <button
                        key={value}
                        onClick={() => toggleDay(value)}
                        disabled={!!showOnly}
                        className={isChosen ? "active" : ""}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
