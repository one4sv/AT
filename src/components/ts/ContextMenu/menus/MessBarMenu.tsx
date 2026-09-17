import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useMessages } from "../../../hooks/MessagesHook";

export default function MessBarMenu() {
    const { showNames, setShowNames } = useMessages();

    return (
        <div
            className="ContextMenuButt"
            onClick={() => setShowNames(!showNames)}
        >
            {showNames ? <EyeSlash /> : <Eye />}
            {showNames ? "Скрыть имена" : "Показать имена"}
        </div>
    );
}