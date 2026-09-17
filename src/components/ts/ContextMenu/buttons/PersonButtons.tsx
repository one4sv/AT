import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { OffSound } from "./Offsound";
import { ToggleBlocked } from "./ToggleBlocked";

export default function PersonButtons() {
    const { menu } = useContextMenu();
    const { chatInfo, options } = menu;

    if (!chatInfo) return null;

    return (
        <>
            <OffSound bool={chatInfo.note} id={options.id} />
            {!chatInfo.is_group && (
                <ToggleBlocked
                    nick={options.nick}
                    bool={chatInfo.is_blocked}
                    id={options.id}
                />
            )}
        </>
    );
}