import { useEffect, useRef, useState } from "react";
import "../../scss/ContextMenu.scss"
import { useContextMenu } from "../hooks/ContextMenuHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import { Bell, BellSlash, Check, CheckCircle, Circle, Link, PencilSimple, Prohibit, PushPin, PushPinSlash, Trash, User } from "@phosphor-icons/react";
import { useUpHabit } from "../hooks/UpdateHabitHook";
import { useDone } from "../hooks/DoneHook";
import { useLocation, useNavigate } from "react-router";
import { api } from "./api";
import { useChat } from "../hooks/ChatHook";

export default function ContextMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout()
    const { setDeleteConfirm } = useDelete()
    const { setPin } = useUpHabit()
    const { markDone } = useDone()
    const { refetchContactsWTLoading, refetchChat } = useChat()

    const navigate = useNavigate()
    const location = useLocation()
    const CopyLink = import.meta.env.VITE_LINK

    const [pos, setPos] = useState<{ top: number; left: number }>({ top: menu.y, left: menu.x });

    const menuRef = useRef<HTMLDivElement>(null);
    
    const habit = menu.habit
    const options = menu.options
    const point = menu.point
    const chatInfo = menu.chatInfo
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

    const offSound = async() => {
        try {
            const res = await api.post("/offsound", {id: options!.id})
            if (res.data.success) {
                refetchContactsWTLoading()
                if (location.pathname === `/chat/${options!.nick}`) refetchChat(options!.nick!)
            }
        } catch (error) {
            console.log("Ошибка при отключении звуков:", error)
        }
    }

    const togglePinned = async() => {
        try {
            const res = await api.post("/togglepinned", {id: options!.id})
            if (res.data.success) {
                console.log("за")
                refetchContactsWTLoading()
                if (location.pathname === `/chat/${options!.nick}`) refetchChat(options!.nick!)
            }
        } catch (error) {
            console.log("Ошибка при переключении закрепления:", error)
        }
    }

    const toggleBlocked = async() => {
        try {
            const res = await api.post("/toggleblocked", {id: options!.id})
            if (res.data.success) {
                refetchContactsWTLoading()
                if (location.pathname === `/chat/${options!.nick}`) refetchChat(options!.nick!)
            }
        } catch (error) {
            console.log("Ошибка при переключении блокировки:", error)
        }
    }
    const deleteButt = (
        <div className="ContextMenuButt delete" onClick={() => {
            setDeleteConfirm({goal:point, id:options!.id, name:options!.name!})
            setBlackout({seted:true, module:"Delete"})}}
        >
            <Trash/>
            Удалить
        </div>
    )

    const linkButt = (
        <div className="ContextMenuButt" onClick={() => {navigator.clipboard.writeText(`${CopyLink}/${point}/${point === "chat" || point === "acc" ? options?.nick : options?.id}`)}}>
            <Link/>
            Скопировать ссылку
        </div>
    )
    const personButt = (
        <>
            <div className="ContextMenuButt" onClick={() => offSound()}>
                {chatInfo?.note ? <BellSlash/> : <Bell/>}
                {chatInfo?.note ? "Без звука" : "Включить звук"}
            </div>
            <div className="ContextMenuButt" onClick={() => toggleBlocked()}>
                {chatInfo?.is_blocked ? <CheckCircle/> : <Prohibit/>}
                {chatInfo?.is_blocked ? "Разблокировать" :"Заблокировать"}
            </div>
        </>
    )

    if (!menu.visible) return null;

    return (
        <div className="ContextMenuWrapper" ref={menuRef} style={{
            top: pos.top,
            left: pos.left,
        }}
        onContextMenu={(e) => e.preventDefault()}
        >
            {point === "habit" && habit && (
                <>
                    {linkButt}
                    {options?.isMy && (
                        <>
                            <div className="ContextMenuButt" onClick={() => markDone(habit.id, dateStr)}>
                                {habit.done ? <CheckCircle weight="fill" /> : <Circle />}
                                {habit.done ? "Выполнено" : "Выполнить"}
                            </div>
                            <div className="ContextMenuButt" onClick={() => setPin(habit.id, !habit.pinned)}>
                                {habit.pinned ? <PushPinSlash/> : <PushPin/>}
                                {habit.pinned ? "Открепить" : "Закрепить"}
                            </div>
                            {deleteButt}
                        </>
                    )}
                </>

            )}
            {point === "chat" && (
                <>
                    {linkButt}
                    <div className="ContextMenuButt" onClick={() => navigate(`/acc/${options.nick}`)}>
                        <User/>
                        Открыть профиль
                    </div>
                    <div className="ContextMenuButt" onClick={() => togglePinned()}>
                        {chatInfo?.pinned ? <PushPinSlash/> : <PushPin/>}
                        {chatInfo?.pinned ? "Открепить чат" : "Закрепить чат"}
                    </div>
                    {personButt}
                    {options && options.isMy && (
                        deleteButt
                    )}
                </>
            )}
            {point === "post" && options.isMy && (
                <>
                    <div className="ContextMenuButt" onClick={() => {
                        if (options.func) options.func();
                    }}>
                        {options.red ? <Check/>: <PencilSimple/>}
                        {options.red ? "Сохранить" : "Редактировать"}
                    </div>
                    {deleteButt}
                </>
            )}
            {point === "acc" && (
                <>
                    {linkButt}
                    {personButt}
                </>
            )}
        </div>
    )
}