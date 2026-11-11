import { CalendarPlusIcon, SneakerMoveIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";

export default function PlanCreateMenu() {
    const { t } = useTranslation("common");
    const { closeMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const open = (module: string) => {
        closeMenu();
        setBlackout({ seted: true, module });
    };
    return <>
        <div className="ContextMenuButt" onClick={() => open("AddPlan")}>
            <CalendarPlusIcon size={20}/>
            {t("plans.create")}
        </div>
        <div className="ContextMenuButt" onClick={() => open("AddHabit")}>
            <SneakerMoveIcon size={20}/>
            {t("sideMenu.newActivity")}
        </div>
    </>;
}
