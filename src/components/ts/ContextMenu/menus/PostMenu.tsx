import ReportButton from "../buttons/ReportButton";
import { PencilSimple, LinkSimple, ShareNetwork, ArrowBendUpRight, ArrowSquareOut } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import DeleteButton from "../buttons/DeleteButton";

export default function PostMenu() {
    const { menu } = useContextMenu();
    const { options } = menu;
    const { t } = useTranslation("acc");

    return (
        <>
            {options.onOpen && <div className="ContextMenuButt" onClick={options.onOpen}>
                <ArrowSquareOut />{t("post.open")}
            </div>}
            <div className="ContextMenuButt" onClick={options.onCopy}>
                <LinkSimple />{t("post.copyLink")}
            </div>
            <div className="ContextMenuButt" onClick={options.onForward}>
                <ArrowBendUpRight />{t("post.forward")}
            </div>
            <div className="ContextMenuButt" onClick={options.onShare}>
                    <ShareNetwork />{t("post.share")}
            </div>
            <ReportButton targetType="post" isMy={!!options.isMy}/>
            {options.isMy && <>
                    <div className="ContextMenuButt" onClick={options.func}>
                        <PencilSimple />{t("post.edit")}
                    </div>
                    <DeleteButton />
            </>}
        </>
    );
}
