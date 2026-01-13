import { useEffect, useState, useRef } from "react";
import { useSettings } from "../../hooks/SettingsHook";
import { useUpSettings } from "../../hooks/UpdateSettingsHook";
import { type TabProps } from "../../modules/Settings";
export default function HabitsTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { orderHabits, amountHabits, } = useSettings();
    const { setNewOrder, setNewAmount } = useUpSettings();


    const [isInitialAmountsSync, setIsInitialAmountsSync] = useState(true);
    const [isInitialOrderSync, setIsInitialOrderSync] = useState(true);

    const [amountEveryday, setAmountEveryday] = useState<number | null>(null);
    const [amountToday, setAmountToday] = useState<number | null>(null);
    const [amountTomorrow, setAmountTomorrow] = useState<number | null>(null);
    const [amountDate, setAmountDate] = useState<number | null>(null);
    const [amountOthers, setAmountOthers] = useState<number | null>(null);
    
    const [displayOrder, setDisplayOrder] = useState<string[]>([]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [notValid, setNotValid] = useState({
        amountEveryday: false,
        amountToday: false,
        amountTomorrow: false,
        amountDate: false,
        amountOthers: false,
    });

    const dragItem = useRef<number | null>(null);
    const amountPattern = /^[0-9]{0,3}$/;

    // Синхронизация amountHabits
    useEffect(() => {
        if (amountHabits && amountHabits.length === 5 && isInitialAmountsSync) {
            setAmountEveryday(amountHabits[0] ?? 0);
            setAmountToday(amountHabits[1] ?? 0);
            setAmountTomorrow(amountHabits[2] ?? 0);
            setAmountOthers(amountHabits[3] ?? 0);
            setAmountDate(amountHabits[4] ?? 0);
            setIsInitialAmountsSync(false);
        }
    }, [amountHabits, isInitialAmountsSync]);

    // Синхронизация порядка привычек
    useEffect(() => {
        if (orderHabits && Array.isArray(orderHabits) && isInitialOrderSync) {
            setDisplayOrder(orderHabits);
            setIsInitialOrderSync(false);
        }
    }, [orderHabits, isInitialOrderSync]);

    // Валидация и отправка обновлений для количества привычек
    useEffect(() => {
        if (
            !isInitialAmountsSync &&
            amountEveryday !== null &&
            amountToday !== null &&
            amountTomorrow !== null &&
            amountDate !== null &&
            amountOthers !== null &&
            (amountEveryday !== amountHabits?.[0] ||
             amountToday !== amountHabits?.[1] ||
             amountTomorrow !== amountHabits?.[2] ||
             amountOthers !== amountHabits?.[3] ||
             amountDate !== amountHabits?.[4])
        ) {
            const handler = setTimeout(() => {
                const isValid =
                    (amountEveryday === null || amountPattern.test(amountEveryday.toString())) &&
                    (amountToday === null || amountPattern.test(amountToday.toString())) &&
                    (amountTomorrow === null || amountPattern.test(amountTomorrow.toString())) &&
                    (amountDate === null || amountPattern.test(amountDate.toString())) &&
                    (amountOthers === null || amountPattern.test(amountOthers.toString()));
                console.log("Saving amounts:", { amountEveryday, amountToday, amountTomorrow, amountOthers, amountDate });
                if (isValid) {
                    setNewAmount([amountEveryday, amountToday, amountTomorrow, amountOthers, amountDate]);
                    setNotValid((prev) => ({
                        ...prev,
                        amountEveryday: false,
                        amountToday: false,
                        amountTomorrow: false,
                        amountDate: false,
                        amountOthers: false,
                    }));
                } else {
                    setNotValid((prev) => ({
                        ...prev,
                        amountEveryday: amountEveryday !== null && !amountPattern.test(amountEveryday.toString()),
                        amountToday: amountToday !== null && !amountPattern.test(amountToday.toString()),
                        amountTomorrow: amountTomorrow !== null && !amountPattern.test(amountTomorrow.toString()),
                        amountDate: amountDate !== null && !amountPattern.test(amountDate.toString()),
                        amountOthers: amountOthers !== null && !amountPattern.test(amountOthers.toString()),
                    }));
                }
            }, 500);
            return () => clearTimeout(handler);
        } else {
            setNotValid((prev) => ({
                ...prev,
                amountEveryday: false,
                amountToday: false,
                amountTomorrow: false,
                amountDate: false,
                amountOthers: false,
            }));
        }
    }, [amountEveryday, amountToday, amountTomorrow, amountDate, amountOthers, amountHabits, setNewAmount, isInitialAmountsSync]);

    // Drag'n'Drop обработчики
    const handleDragEnd = () => {
        dragItem.current = null;
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    const handleDragStart = (_e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        setDraggingIndex(index);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (_e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        if (dragItem.current === null) return;
        const newOrder = [...displayOrder];
        const draggedItem = newOrder.splice(dragItem.current, 1)[0];
        newOrder.splice(dropIndex, 0, draggedItem);
        setDisplayOrder(newOrder);
        dragItem.current = null;
        setDraggingIndex(null);
        setDragOverIndex(null);
        setNewOrder(newOrder);
    };

    const getHabitLabel = (type: string) => {
        switch (type) {
            case "everyday":
                return "Ежедневные";
            case "weekly":
                return "По дате";
            case "sometimes":
                return "Иногда";
            default:
                return type;
        }
    };

    return (
        <div className="tab" ref={tabRef}>
            <span className="spanMain">Активности</span>
            {fadingOutSections.includes("habits") && (
                <span
                    className={`spanSave ${!isUpdating.includes("habits") ? "fade-out" : ""}`}
                    onAnimationEnd={() => handleAnimationEnd("habits")}
                >
                    Сохранение...
                </span>
            )}
            <div className="settingsTab">
                <div className="settingsOrder">
                    <div className="feedSettingsOrder">
                        <div className="settingSpan">Порядок отображения:</div>
                        <div className="orderFull">
                            <div className="orderShown">
                                {displayOrder.map((type, index) => (
                                    <div
                                        key={type}
                                        className={`orderSetDiv 
                                            ${draggingIndex === index ? "dragging" : ""} 
                                            ${dragOverIndex === index ? "drag-over" : ""}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        {getHabitLabel(type)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="feedSettingsOrder">
                        <div className="settingSpan">Количество привычек на главной странице:</div>
                        <div className="amountHabits">
                            <div className="inpAmountWrapper">
                                <span>Ежедневные</span>
                                <input
                                    type="number"
                                    value={amountEveryday ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAmountEveryday(val === "" ? null : Number(val) || 0);
                                    }}
                                    min={0}
                                    max={999}
                                    pattern="^[0-9]{0,3}$"
                                    className={notValid.amountEveryday ? "inputNotValid" : ""}
                                />
                            </div>
                            <div className="inpAmountWrapper">
                                <span>Сегодня</span>
                                <input
                                    type="number"
                                    value={amountToday ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAmountToday(val === "" ? null : Number(val) || 0);
                                    }}
                                    min={0}
                                    max={999}
                                    pattern="^[0-9]{0,3}$"
                                    className={notValid.amountToday ? "inputNotValid" : ""}
                                />
                            </div>
                            <div className="inpAmountWrapper">
                                <span>Завтра</span>
                                <input
                                    type="number"
                                    value={amountTomorrow ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAmountTomorrow(val === "" ? null : Number(val) || 0);
                                    }}
                                    min={0}
                                    max={999}
                                    pattern="^[0-9]{0,3}$"
                                    className={notValid.amountTomorrow ? "inputNotValid" : ""}
                                />
                            </div>
                            <div className="inpAmountWrapper">
                                <span>Датированные</span>
                                <input
                                    type="number"
                                    value={amountDate ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAmountDate(val === "" ? null : Number(val) || 0);
                                    }}
                                    min={0}
                                    max={999}
                                    pattern="^[0-9]{0,3}$"
                                    className={notValid.amountDate ? "inputNotValid" : ""}
                                />
                            </div>
                            <div className="inpAmountWrapper">
                                <span>Иногда</span>
                                <input
                                    type="number"
                                    value={amountOthers ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setAmountOthers(val === "" ? null : Number(val) || 0);
                                    }}
                                    min={0}
                                    max={999}
                                    pattern="^[0-9]{0,3}$"
                                    className={notValid.amountOthers ? "inputNotValid" : ""}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}