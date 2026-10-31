import { ArrowBendUpLeftIcon, CopyIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";

export default function CommentMenu() {
    const { menu } = useContextMenu();
    const { options } = menu;
    const { t } = useTranslation("acc");

    return <>
        {options.onReply && <div className="ContextMenuButt" onClick={options.onReply}>
            <ArrowBendUpLeftIcon /> {t("post.commentReply")}
        </div>}
        {options.onCopy && <div className="ContextMenuButt" onClick={options.onCopy}>
            <CopyIcon /> {t("post.commentCopy")}
        </div>}
        {options.isMy && <>
            <div className="ContextMenuButt" onClick={options.onEdit}>
                <PencilSimpleIcon /> {t("post.edit")}
            </div>
            <div className="ContextMenuButt delete" onClick={options.onDelete}>
                <TrashIcon /> {t("post.commentDelete")}
            </div>
        </>}
    </>;
}
