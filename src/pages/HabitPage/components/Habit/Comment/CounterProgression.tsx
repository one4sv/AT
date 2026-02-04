import type { habitCounter } from "../../../../../components/context/TheHabitContext";
import { timeToStr } from "../../../utils/dateToStr";

export default function CounterProgression({currentCounter}:{currentCounter:habitCounter | null, isHistorical:boolean}) {
    const events = currentCounter?.progression
    if (!events) {
        return (
            <div className="completionProgress">
                <div className="eventStr emptyEvents">Сессия не начата</div>
            </div>
        )
    }
    return (
        <div className="completionProgress">
            {events.map((event, index) => {
                const key = `${event.count}-${event.time}-${index}`
                return (
                    <div className="eventStr eventCounter" key={key}>
                        <span className="eventTime">{timeToStr(event.time)}</span> значение изменено на {event.count}
                    </div>
                )
            })}
        </div>
    )
}