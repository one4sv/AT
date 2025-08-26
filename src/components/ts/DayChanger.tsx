export default function DayChanger({
    chosenDays,
    toggleDay,
    showOnly
}: {
    chosenDays: { value: number; label: string; chosen: boolean }[];
    toggleDay: (value: number) => void;
    showOnly?:boolean | undefined
}) {
    return (
        <div className="dayChanger">
            {chosenDays.map(({ value, label, chosen }) => (
                <button
                    key={value}
                    onClick={() => toggleDay(value)}
                    disabled={showOnly || false}
                    className={chosen ? "active" : ""}

                >
                    {label}
                </button>
            ))}
        </div>
    );
}
