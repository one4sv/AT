import { Trash } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useDelete } from "../../../hooks/DeleteHook";

interface Props {
    goal?: string;
    label?: string;
}

export default function DeleteButton({ goal, label = "Удалить" }: Props) {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm } = useDelete();

    const point = goal || menu.point;
    const { options } = menu;

    return (
        <div
            className="ContextMenuButt delete"
            onClick={() => {
                setDeleteConfirm({
                    goal: point,
                    id: options.id,
                    name: options.name!,
                });
                setBlackout({ seted: true, module: "Delete" });
            }}
        >
            <Trash />
            {label}
        </div>
    );
}