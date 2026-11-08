import ReportButton from "../buttons/ReportButton";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("common");
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm, setDeleteMess } = useDelete();
    const { setReaction, messages, setActiveHeader, activeHeader } = useChat();
    const {
        chosenMess,
        setChosenMess,
        setAnswer,
        setEditing,
        setRedirect,
    } = useMessages();
    const { pinMess } = useSendMess();

    const { options, curChat, point } = menu;
    const isChose = activeHeader === "choosing"
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
                    {t("chatMenu.reaction")}
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
                    {t("chatMenu.edit")}
                </div>
            )}

            {options?.url && options?.name && !isChose && DownloadButt(options.url, options.name)}

            <div
                className="ContextMenuButt"
                onClick={() => {
                    if (!isChose) {
                        setActiveHeader("choosing");
                        setChosenMess([
                            { id: Number(options.id), text: curChat.text! },
                        ]);
                    } else {
                        setChosenMess([]);
                        setActiveHeader("text");
                    }
                }}
            >
                {isChose ? <Circle /> : <CheckCircle />}
                {isChose ? t("chatMenu.cancelSelection") : t("chatMenu.select")}
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
                    {t("chatMenu.reply")}
                </div>
            )}

            {(chosenMess.some(message => !!message.text?.trim()) || !!curChat.text?.trim()) && <div
                className="ContextMenuButt"
                onClick={() => {
                    const content = chosenMess.length > 0
                        ? [...chosenMess].sort((a, b) => a.id - b.id).map(message => message.text || "").join("\n")
                        : curChat.text || "";
                    void navigator.clipboard.writeText(content);
                }}
            >
                <CopySimple />
                {t(chosenMess.length > 0 ? "chatMenu.copySelected" : "chatMenu.copy")}
            </div>}

            <div
                className="ContextMenuButt"
                onClick={() => pinMess(options.id)}
            >
                {curChat.is_pinned ? <PushPinSlash /> : <PushPin />}
                {curChat.is_pinned ? t("chatMenu.unpin") : t("chatMenu.pin")}
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
                    ? t("chatMenu.forwardSelected")
                    : t("chatMenu.forward")}
            </div>

            <ReportButton targetType="message" isMy={!!curChat.isMy}/>
            <div
                className="ContextMenuButt delete"
                onClick={() => {
                    if (chosenMess.length > 0) {
                        setDeleteConfirm({
                            goal: point,
                            id: "",
                            name: t("chatMenu.messages"),
                        });
                        setDeleteMess(chosenMess.map((m) => m.id));
                    } else {
                        setDeleteConfirm({
                            goal: point,
                            id: options.id,
                            name: t("chatMenu.messages"),
                        });
                    }
                    setBlackout({ seted: true, module: "Delete" });
                }}
            >
                <Trash />
                {chosenMess.length > 0
                    ? t("chatMenu.deleteSelected")
                    : t("chatMenu.delete")}
            </div>
        </>
    );
}