import { useNavigate } from "react-router";
import { useBlackout } from "../BlackoutHook";
import { useMessages } from "../MessagesHook";
import { useUser } from "../UserHook";
import type { ForwardMedia } from "../../context/MessagesContext";

export default function useForwardMedia() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { setBlackout, setBlackoutStack } = useBlackout();
    const { setForwardMedia } = useMessages();

    return (media: ForwardMedia) => {
        if (!user.id) {
            setBlackoutStack([]);
            navigate("/sign");
            return;
        }
        setForwardMedia({ ...media, targetPath: undefined });
        setBlackout({ seted: true, module: "Redirecting", isRoot: true });
    };
}
