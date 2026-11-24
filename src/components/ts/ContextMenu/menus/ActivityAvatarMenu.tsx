import {useTranslation} from "react-i18next";
import {PencilSimpleIcon,ImageIcon,TrashIcon} from "@phosphor-icons/react";
import {useContextMenu} from "../../../hooks/ContextMenuHook";
export default function ActivityAvatarMenu(){
    const {t}=useTranslation("common"),{menu,closeMenu}=useContextMenu();
    const {onEdit,onOpen,onDelete}=menu.options;
    return <>
        <div className="ContextMenuButt" onClick={()=>{closeMenu();onEdit?.();}}><PencilSimpleIcon/>{t("activityImages.replace")}</div>
        <div className="ContextMenuButt" onClick={()=>{closeMenu();onOpen?.();}}><ImageIcon/>{t("activityImages.view")}</div>
        <div className="ContextMenuButt delete" onClick={()=>{closeMenu();onDelete?.();}}><TrashIcon/>{t("activityImages.removeAvatar")}</div>
    </>;
}
