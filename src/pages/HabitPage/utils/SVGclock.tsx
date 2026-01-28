export function SVGclock() {
    return (
        <svg
            width="100"
            height="120"
            viewBox="0 0 200 200"
        >
            <line
                x1="75"
                y1="0"
                x2="125"
                y2="0"
                stroke="white"
                strokeWidth="10"
                strokeLinecap="round"
            />
            {/* Циферблат */}
            <circle
                cx="100"
                cy="110"
                r="95"
                stroke="white"
                strokeWidth="10"
                fill="none"
            />

            {/* Центральная точка */}
            <circle cx="100" cy="110" r="8" fill="white" />

            {/* Секундная стрелка */}
            <line
                x1="100"
                y1="110"
                x2="100"
                y2="35"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                transform={`rotate(100 100)`}
            />
        </svg>
    )
}