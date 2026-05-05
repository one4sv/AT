export const DeleteTimer = ({
    progress,
    timeLeft
}: {
    progress: number
    timeLeft: number
}) => {
    const size = 34
    const center = size / 2
    const radius = 14
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - progress)

    return (
        <svg width={size} height={size} className={timeLeft === 1 ? "pulseDanger" : ""}>
            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#555"
                strokeWidth="2"
                fill="transparent"
            />

            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#ff4d4f"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
            />

            <text
                x={center}
                y={center}
                textAnchor="middle"
                fontSize="14"
                fill="#fff"
                dominantBaseline="middle"
                fontWeight="500"
            >
                {timeLeft}
            </text>
        </svg>
    )
}