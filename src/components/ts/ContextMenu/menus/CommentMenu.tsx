import { ArrowBendUpLeftIcon, CopyIcon, LinkSimpleIcon, UserIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useNavigate } from "react-router-dom";

export default function CommentMenu() {
    const { menu, closeMenu } = useContextMenu();
    const navigate = useNavigate();
    const { options } = menu;
    const { t } = useTranslation("acc");

    return <>
        {options.nick && <div className="ContextMenuButt" onClick={() => { closeMenu(); navigate(`/acc/${options.nick}`); }}>
            <UserIcon /> {t("post.openAuthor")}
        </div>}
        {options.onCopyLink && <div className="ContextMenuButt" onClick={options.onCopyLink}>
            <LinkSimpleIcon /> {t("post.commentCopyLink")}
        </div>}
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
