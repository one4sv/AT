import "../../../scss/svgClock.scss"

export function SVGclock({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }) {
    const centerX = 100
    const centerY = 110

    const secondAngle = seconds * 6  // 360 / 60 = 6
    const minuteAngle = minutes * 6 + seconds * 0.1  // 360 / 60 = 6, плюс движение от секунд
    const hourAngle = (hours % 12) * 30 + minutes * 0.5 + seconds * (0.5 / 60)  // 360 / 12 = 30, плюс движение от минут и секунд

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
                className="topLineClock"
                strokeWidth="10"
                strokeLinecap="round"
            />
            {/* Циферблат */}
            <circle
                className="dialClock"
                cx={centerX}
                cy={centerY}
                r="95"
                strokeWidth="10"
                fill="none"
            />

            {/* Центральная точка */}
            <circle className="centerDotClock" cx={centerX} cy={centerY} r="8" />

            {/* Часовая стрелка */}
            <line
                className="hourLineClock"
                x1={centerX}
                y1={centerY}
                x2={centerX}
                y2={centerY - 60}  // Короткая стрелка для часов
                strokeWidth="8"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} ${centerX} ${centerY})`}
            />

            {/* Минутная стрелка */}
            <line
                className="minLineClock"
                x1={centerX}
                y1={centerY}
                x2={centerX}
                y2={centerY - 75}  // Длиннее, чем часовая
                strokeWidth="6"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle} ${centerX} ${centerY})`}
            />

            {/* Секундная стрелка */}
            <line
                className="secLineClock"
                x1={centerX}
                y1={centerY}
                x2={centerX}
                y2={centerY - 85}  // Самая длинная
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${secondAngle} ${centerX} ${centerY})`}
            />
        </svg>
    )
}