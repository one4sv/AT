import { useEffect, useRef, useState } from "react";
import "../../scss/ContextMenu.scss"
import { useContextMenu } from "../hooks/ContextMenuHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import { Bell, BellSlash, Check, CheckCircle, Circle, CopySimple, Heart, Link, PencilSimple, Prohibit, PushPin, PushPinSlash, ShareFat, Trash, User } from "@phosphor-icons/react";
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
    const { refetchContactsWTLoading, refetchChat, setReaction } = useChat()

    const navigate = useNavigate()
    const location = useLocation()
    const CopyLink = import.meta.env.VITE_LINK

    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [isAdjusted, setIsAdjusted] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    
    const habit = menu.habit
    const options = menu.options
    const point = menu.point
    const chatInfo = menu.chatInfo
    const curChat = menu.curChat
    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

    useEffect(() => {
        if (!menu.visible) {
            setIsAdjusted(false);
            return;
        }

        if (!menuRef.current) return;

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
        setIsAdjusted(true);
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
            <div className={`ContextMenuButt ${chatInfo?.is_blocked ? "" : "delete"}`} onClick={() => toggleBlocked()}>
                {chatInfo?.is_blocked ? <Prohibit weight="fill"/> : <Prohibit/>}
                {chatInfo?.is_blocked ? "Разблокировать" : "Заблокировать"}
            </div>
        </>
    )

    if (!menu.visible) return null;

    const currentPos = isAdjusted ? pos : { top: menu.y, left: menu.x };

    return (
        <div className="ContextMenuWrapper" ref={menuRef} style={{
            top: currentPos.top,
            left: currentPos.left,
            visibility: isAdjusted ? 'visible' : 'hidden',
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
            {point === "acc" && curChat && curChat.setMess && (
                <>
                    <div className="ContextMenuButt" onClick={() => {
                        curChat.setIsChose(!curChat.isChose)
                        curChat.setMess([])
                    }}>
                        {curChat.isChose ? <Circle/> : <CheckCircle />}
                        {curChat.isChose ? "Отменить выбор" : "Выбрать сообщения"}
                    </div>
                    {linkButt}
                    {personButt}
                </>
            )}
            {point === "mess" && curChat && curChat.setMess && (
                <>
                    {!curChat.isChose && (
                        <div className="ContextMenuButt" onClick={() => setReaction(Number(options.id), "Heart")}>
                            {curChat.isReacted !== "none" ? <Heart weight="fill"/> : <Heart/>}
                            Реакция
                        </div>
                    )}
                    {!curChat.isChose && curChat.isMy &&(
                        <div className="ContextMenuButt">
                            <PencilSimple/>
                            Изменить
                        </div>
                    )}
                    <div className="ContextMenuButt" onClick={() => {
                        if (!curChat.isChose) {
                            curChat.setIsChose(true)
                            curChat.setMess!([Number(options.id)])
                        }
                        else {
                            curChat.setMess([])
                            curChat.setIsChose(false)
                        }
                    }}>
                        {curChat.isChose ? <Circle/> : <CheckCircle />}
                        {curChat.isChose ? "Отменить выбор" : "Выбрать"}
                    </div>
                    {!curChat.isChose && (
                        <div className="ContextMenuButt">
                            <ShareFat style={{ transform: "scaleX(-1)" }}/>
                            Ответить
                        </div>
                    )}
                    <div className="ContextMenuButt">
                        <CopySimple />
                        {curChat.chosenMess.length > 0 ? "Копировать выбранное" : "Копировать"}
                    </div>
                    <div className="ContextMenuButt">
                        <ShareFat/>
                        {curChat.chosenMess.length > 0 ? "Переслать выбранное" : "Переслать"}
                    </div>                    
                    <div className="ContextMenuButt delete">
                        <Trash/>
                        {curChat.chosenMess.length > 0 ? "Удалить выбранное" : "Удалить"}
                    </div>
                </>
            )}
        </div>
    )
}