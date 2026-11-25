import ReportButton from "../buttons/ReportButton";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, SignOut } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useDelete } from "../../../hooks/DeleteHook";
import { useMessages } from "../../../hooks/MessagesHook";
import LinkButton from "../buttons/LinkButton";
import PersonButtons from "../buttons/PersonButtons";
import { useChat } from "../../../hooks/ChatHook";

export default function AccMenu() {
    const { t } = useTranslation("common");
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm } = useDelete();
    const { setChosenMess } = useMessages();
    const { library, activeHeader: header, setActiveHeader:setHeader, chatPanelHidden, setChatPanelHidden } = useChat()

    const { options, chatInfo } = menu;

    return (
        <>
            <div className="ContextMenuButt" onClick={() => {
                if (header === "text" || header === "habit") {
                    setChosenMess([]);
                    setHeader(library?.pins.length ? "pinned" : "search");
                    setChatPanelHidden(false);
                } else setChatPanelHidden(previous => !previous);
            }}>
                <MagnifyingGlassIcon/>{t(header === "text" || header === "habit" || chatPanelHidden ? "chatUi.openPanel" : "chatUi.hidePanel")}
            </div>
            <LinkButton />
            <PersonButtons />
            {!chatInfo?.is_group && options.nick && <ReportButton targetType="account" targetId={options.nick}/>} 

            {chatInfo?.is_group && (
                <div
                    className="ContextMenuButt delete"
                    onClick={() => {
                        setDeleteConfirm({
                            goal: "leave",
                            id: options.id,
                            name: options.name!,
                        });
                        setBlackout({ seted: true, module: "Delete" });
                    }}
                >
                    <SignOut />
                    {t("chatUi.leave")}
                </div>
            )}
        </>
    );
}