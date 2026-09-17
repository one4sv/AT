import {
    CheckCircle,
    Circle,
    CopySimple,
    Heart,
    PencilSimple,
    PushPin,
    PushPinSlash,
    ShareFat,
    Trash,
} from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useDelete } from "../../../hooks/DeleteHook";
import { useChat } from "../../../hooks/ChatHook";
import { useMessages } from "../../../hooks/MessagesHook";
import { useSendMess } from "../../../hooks/SendMessHook";
import { DownloadButt } from "../buttons/DownloadButt";

export default function MessMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm, setDeleteMess } = useDelete();
    const { setReaction, messages } = useChat();
    const {
        isChose,
        setIsChose,
        chosenMess,
        setChosenMess,
        setAnswer,
        setEditing,
        setRedirect,
    } = useMessages();
    const { pinMess } = useSendMess();

    const { options, curChat, point } = menu;

    if (!curChat || !setChosenMess) return null;

    return (
        <>
            {!isChose && (
                <div
                    className="ContextMenuButt"
                    onClick={() => setReaction(Number(options.id), "Heart")}
                >
                    {curChat.isReacted !== "none" ? (
                        <Heart weight="fill" />
                    ) : (
                        <Heart />
                    )}
                    Реакция
                </div>
            )}

            {!isChose && curChat.isMy && (
                <div
                    className="ContextMenuButt"
                    onClick={() => {
                        setEditing({
                            id: options.id,
                            text: curChat.text!,
                            media: curChat.files,
                            previewText: curChat.previewText,
                        });
                    }}
                >
                    <PencilSimple />
                    Изменить
                </div>
            )}

            {options?.url && options?.name && !isChose && DownloadButt(options.url, options.name)}

            <div
                className="ContextMenuButt"
                onClick={() => {
                    if (!isChose) {
                        setIsChose(true);
                        setChosenMess([
                            { id: Number(options.id), text: curChat.text! },
                        ]);
                    } else {
                        setChosenMess([]);
                        setIsChose(false);
                    }
                }}
            >
                {isChose ? <Circle /> : <CheckCircle />}
                {isChose ? "Отменить выбор" : "Выбрать"}
            </div>

            {!isChose && (
                <div
                    className="ContextMenuButt"
                    onClick={() => {
                        setAnswer({
                            id: options.id,
                            sender: curChat.sender!,
                            text: curChat.text!,
                            previewText: curChat.previewText,
                        });
                    }}
                >
                    <ShareFat style={{ transform: "scaleX(-1)" }} />
                    Ответить
                </div>
            )}

            <div
                className="ContextMenuButt"
                onClick={() => {
                    if (chosenMess.length > 0) {
                        const result = chosenMess
                            .sort((a, b) => a.id - b.id)
                            .map((m) => m.text)
                            .join("\n");
                        navigator.clipboard.writeText(result);
                    } else {
                        navigator.clipboard.writeText(curChat.text!);
                    }
                }}
            >
                <CopySimple />
                {chosenMess.length > 0
                    ? "Копировать выбранное"
                    : "Копировать"}
            </div>

            <div
                className="ContextMenuButt"
                onClick={() => pinMess(options.id)}
            >
                {curChat.is_pinned ? <PushPinSlash /> : <PushPin />}
                {curChat.is_pinned ? "Открепить" : "Закрепить"}
            </div>

            <div
                className="ContextMenuButt"
                onClick={() => {
                    const redirectValue =
                        chosenMess.length > 0
                            ? messages.filter((m) =>
                                  chosenMess.some((cm) => cm.id === m.id)
                              )
                            : messages.filter(
                                  (m) => m.id === Number(options.id)
                              );

                    setRedirect(redirectValue);
                    setBlackout({ seted: true, module: "Redirecting" });
                    setChosenMess([]);
                }}
            >
                <ShareFat />
                {chosenMess.length > 0
                    ? "Переслать выбранное"
                    : "Переслать"}
            </div>

            <div
                className="ContextMenuButt delete"
                onClick={() => {
                    if (chosenMess.length > 0) {
                        setDeleteConfirm({
                            goal: point,
                            id: "",
                            name: "сообщений",
                        });
                        setDeleteMess(chosenMess.map((m) => m.id));
                    } else {
                        setDeleteConfirm({
                            goal: point,
                            id: options.id,
                            name: "сообщений",
                        });
                    }
                    setBlackout({ seted: true, module: "Delete" });
                }}
            >
                <Trash />
                {chosenMess.length > 0
                    ? "Удалить выбранное"
                    : "Удалить"}
            </div>
        </>
    );
}