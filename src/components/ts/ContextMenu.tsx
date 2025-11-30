import { useEffect, useRef, useState } from "react";
import "../../scss/ContextMenu.scss"
import { useContextMenu } from "../hooks/ContextMenuHook";
import { createPortal } from "react-dom";
import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import { Check, CheckCircle, Circle, PencilSimple, PushPin, PushPinSlash, Trash } from "@phosphor-icons/react";
import { useUpHabit } from "../hooks/UpdateHabitHook";
import { useDone } from "../hooks/DoneHook";

export default function ContextMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout()
    const { setDeleteConfirm } = useDelete()
    const { setPin } = useUpHabit()
    const { markDone } = useDone()
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: menu.y, left: menu.x });

    const menuRef = useRef<HTMLDivElement>(null);
    
    const habit = menu.habit
    const options = menu.options
    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

    useEffect(() => {
        if (!menu.visible || !menuRef.current) return;

        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = menu.x;
        let top = menu.y;

        if (left + menuRect.width > viewportWidth) {
            left = viewportWidth - menuRect.width - 10;
            if (left < 0) left = 0;
        }

        if (top + menuRect.height > viewportHeight) {
            top = viewportHeight - menuRect.height - 10;
            if (top < 0) top = 0;
        }

        setPos({ top, left });
    }, [menu.x, menu.y, menu.visible]);

    const deleteButt = () => {
        if (!options || !options.id || !options.name) return null;
        return (
            <div className="ContextMenuButt delete" onClick={() => {
                setDeleteConfirm({goal:menu.point, id:options.id, name:options.name!})
                setBlackout({seted:true, module:"Delete"})}}
            >
                <Trash/>
                Удалить
            </div>
        )
    }

    if (!menu.visible) return null;

    const menuContent = (
        <div className="ContextMenuWrapper" ref={menuRef} style={{
            top: pos.top,
            left: pos.left,
        }}
        onContextMenu={(e) => e.preventDefault()}
        >
            {menu.point === "habit" && habit && (
                <>
                    <div className="ContextMenuButt" onClick={() => markDone(habit.id, dateStr)}>
                        {habit.done ? <CheckCircle weight="fill" /> : <Circle />}
                        {habit.done ? "Выполнено" : "Выполнить"}
                    </div>
                    <div className="ContextMenuButt" onClick={() => setPin(habit.id, !habit.pinned)}>
                        {habit.pinned ? <PushPinSlash/> : <PushPin/>}
                        {habit.pinned ? "Открепить" : "Закрепить"}
                    </div>
                    {deleteButt()}
                </>
            )}
            {menu.point === "chat" && options && options.id && options.name && (
                deleteButt()
            )}
            {menu.point === "post" && options && options.id && options.name && (
                <>
                    <div className="ContextMenuButt" onClick={() => {
                        if (options.func) options.func();
                    }}>
                        {options.red ? <Check/>: <PencilSimple/>}
                        {options.red ? "Сохранить" : "Редактировать"}
                    </div>
                    {deleteButt()}
                </>
            )}

        </div>
    )
    return createPortal(menuContent, document.body);
}