import { useEffect, useState, useRef } from "react";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import DatePicker from "react-datepicker";

export default function HabitsTab() {
    const { orderHabits, showArchived, showArchivedInAcc, weekStart } = useSettings();
    const { setNewOrder, setNewShowArchived, setNewShowArchivedInAcc, setNewWeekStart } = useUpSettings();

    const [isInitialOrderSync, setIsInitialOrderSync] = useState(true);
    
    const [displayOrder, setDisplayOrder] = useState<string[]>([]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);


    const dragItem = useRef<number | null>(null);

    useEffect(() => {
        if (orderHabits && Array.isArray(orderHabits) && isInitialOrderSync) {
            setDisplayOrder(orderHabits);
            setIsInitialOrderSync(false);
        }
    }, [orderHabits, isInitialOrderSync]);

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
        <div className="settingTab"> 
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Архив
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => setNewShowArchived(!showArchived)}>
                        Архивные в боковом меню
                        <Toggler state={showArchived}/>
                    </div>
                    <div className="settingHint">
                        Показывать архивированные активности в боковом меню
                    </div>
                    <div className="settingTogglerDiv" onClick={() => setNewShowArchivedInAcc(!showArchivedInAcc)}>
                        Архивные в моём профиле
                        <Toggler state={showArchivedInAcc}/>
                    </div>
                    <div className="settingHint">
                        Показывать архивированные активности вместе активными другим пользователям в моём профиле (если активности скрыты, архивные также не будут отображаться)
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Расписание
                </div>
                <div className="habitTabDiv">
                    Ввести отчёт недель с
                    <DatePicker
                        className="habitTabDP"
                        selected={weekStart ? new Date(weekStart) : null}
                        maxDate={new Date()}
                        dateFormat="dd.MM.yyyy"
                        minDate={new Date(2000,0,1)}
                        onChange={(date)=> {
                            if(!date) return
                            const formatted = date.toISOString().split("T")[0]
                            setNewWeekStart(formatted)
                        }}
                    />
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Порядок отображения
                </div>
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
    );
}