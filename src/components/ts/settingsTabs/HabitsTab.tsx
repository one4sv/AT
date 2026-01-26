import { useEffect, useState, useRef } from "react";
import { useSettings } from "../../hooks/SettingsHook";
import { useUpSettings } from "../../hooks/UpdateSettingsHook";
import { type TabProps } from "../../modules/Settings";
import Toggler from "../toggler";
export default function HabitsTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { orderHabits, showArchived, showArchivedInAcc } = useSettings();
    const { setNewOrder, setNewShowArchived, setNewShowArchivedInAcc } = useUpSettings();

    const [isInitialOrderSync, setIsInitialOrderSync] = useState(true);
    
    const [displayOrder, setDisplayOrder] = useState<string[]>([]);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);


    const dragItem = useRef<number | null>(null);

    // Синхронизация порядка привычек
    useEffect(() => {
        if (orderHabits && Array.isArray(orderHabits) && isInitialOrderSync) {
            setDisplayOrder(orderHabits);
            setIsInitialOrderSync(false);
        }
    }, [orderHabits, isInitialOrderSync]);

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
                <div className="persTabDivDouble">
                    <div className="settingsOrder">
                        <div className="settingSpan">
                            Порядок отображения:
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
                    <div className="archiveSettings">
                        <div className="settingSpan">
                            Архив привычек:
                        </div>
                        <div className="archiveSettingToggler">
                            Показывать архивные в боковом меню
                            <Toggler state={showArchived} funcToggle={setNewShowArchived}/>
                        </div>
                        <div className="archiveSettingToggler">
                            Показывать архивные в моём профиле
                            <Toggler state={showArchivedInAcc} funcToggle={setNewShowArchivedInAcc}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}