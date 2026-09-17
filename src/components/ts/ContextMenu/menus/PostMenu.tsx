import { Check, PencilSimple } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import DeleteButton from "../buttons/DeleteButton";

export default function PostMenu() {
    const { menu } = useContextMenu();
    const { options } = menu;

    if (!options.isMy) return null;

    return (
        <>
            <div
                className="ContextMenuButt"
                onClick={() => {
                    if (options.func) options.func();
                }}
            >
                {options.red ? <Check /> : <PencilSimple />}
                {options.red ? "Сохранить" : "Редактировать"}
            </div>
            <DeleteButton />
        </>
    );
}