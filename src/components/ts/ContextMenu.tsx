import { useEffect, useRef, useState } from "react";
import "../../scss/ContextMenu.scss"
import { useContextMenu } from "../hooks/ContextMenuHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import {  ChatTeardrop, Check, CheckCircle, Circle, CopySimple, Heart, Link, PencilSimple, PushPin, PushPinSlash, ShareFat, Trash, User } from "@phosphor-icons/react";
import { useUpHabit } from "../hooks/UpdateHabitHook";
import { useDone } from "../hooks/DoneHook";
import { useNavigate } from "react-router";
import { useChat } from "../hooks/ChatHook";
import { OffSound } from "./CM/funcs/Offsound";
import { ToggleBlocked } from "./CM/funcs/ToggleBlocked";
import { TogglePinned } from "./CM/funcs/TogglePinned";
import { DownloadButt } from "./CM/funcs/DownloadButt";
import { useMessages } from "../hooks/MessagesHook";

export default function ContextMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout()
    const { setDeleteConfirm, setDeleteMess } = useDelete()
    const { setPin } = useUpHabit()
    const { markDone } = useDone()
    const { isChose, setIsChose, chosenMess, setChosenMess, setPendingScrollId } = useMessages()
    const { setReaction } = useChat()

    const navigate = useNavigate()
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

    const deleteButt = (
        <div className="ContextMenuButt delete" onClick={() => {
            setDeleteConfirm({goal:point, id:options.id, name:options.name!})
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
            {chatInfo && (
                <>
                    <OffSound bool={chatInfo.note} id={options.id}/>
                    <ToggleBlocked nick={options.nick} bool={chatInfo.is_blocked} id={options.id}/>
                </>
            )}


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
                    <TogglePinned bool={chatInfo!.pinned} id={options.id}/>
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
                    <div className="ContextMenuButt" onClick={() => {
                        setIsChose(!isChose)
                        setChosenMess([])
                    }}>
                        {isChose ? <Circle/> : <CheckCircle />}
                        {isChose ? "Отменить выбор" : "Выбрать сообщения"}
                    </div>
                    {linkButt}
                    {personButt}
                </>
            )}
            {point === "mess" && curChat && setChosenMess && (
                <>
                    {!isChose && (
                        <div className="ContextMenuButt" onClick={() => setReaction(Number(options.id), "Heart")}>
                            {curChat.isReacted !== "none" ? <Heart weight="fill"/> : <Heart/>}
                            Реакция
                        </div>
                    )}
                    {!isChose && curChat.isMy &&(
                        <div className="ContextMenuButt">
                            <PencilSimple/>
                            Изменить
                        </div>
                    )}
                    <div className="ContextMenuButt" onClick={() => {
                        if (!isChose) {
                            setIsChose(true)
                            setChosenMess!([{id:Number(options.id), text:curChat.text!}])
                        }
                        else {
                            setChosenMess([])
                            setIsChose(false)
                        }
                    }}>
                        {isChose ? <Circle/> : <CheckCircle />}
                        {isChose ? "Отменить выбор" : "Выбрать"}
                    </div>
                    {!isChose && (
                        <div className="ContextMenuButt">
                            <ShareFat style={{ transform: "scaleX(-1)" }}/>
                            Ответить
                        </div>
                    )}
                    <div className="ContextMenuButt" onClick={() => {
                        if (chosenMess.length > 0) {
                            const result = chosenMess
                                .sort((a,b) => a.id - b.id)
                                .map(m => m.text)
                                .join("\n")
                            navigator.clipboard.writeText(result)
                        }
                        else navigator.clipboard.writeText(curChat.text!)
                    }}>
                        <CopySimple />
                        {chosenMess.length > 0 ? "Копировать выбранное" : "Копировать"}
                    </div>
                    <div className="ContextMenuButt">
                        <ShareFat/>
                        {chosenMess.length > 0 ? "Переслать выбранное" : "Переслать"}
                    </div>                    
                    <div className="ContextMenuButt delete" onClick={() => {
                        if (chosenMess.length > 0) {
                            setDeleteConfirm({goal:point, id:"", name:"сообщений"})
                            setDeleteMess(chosenMess.map((m) => m.id))
                        }
                        else setDeleteConfirm({goal:point, id:options.id, name:"сообщений"})
                        setBlackout({seted:true, module:"Delete"})
                    }}>
                        <Trash/>
                        {chosenMess.length > 0 ? "Удалить выбранное" : "Удалить"}
                    </div>
                </>
            )}
            {point==="media" && (
                <>
                    {options.url && options.name && DownloadButt(options.url, options.name)}
                    <div className="ContextMenuButt" onClick={() => {
                        setPendingScrollId(Number(options.id));  // Установите ID перед навигацией
                        navigate(`/chat/${options.nick}`);
                    }}>
                        <ChatTeardrop style={{ transform: "scaleX(-1)" }}/>
                        Показать в чате
                    </div>
                </>
            )}
        </div>
    )
}