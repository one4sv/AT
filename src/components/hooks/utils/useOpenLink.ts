import { useNavigate } from "react-router";
import { useBlackout } from "../BlackoutHook";

export default function useOpenLink() {
    const navigate = useNavigate();
    const { setBlackout } = useBlackout();

    return (href: string, closeModal = false) => {
        let url: URL;
        try {
            const address = href.startsWith("www.") ? `https://${href}` : href;
            url = new URL(address, window.location.origin);
        } catch {
            return false;
        }

        if (!['http:', 'https:'].includes(url.protocol)) return false;

        const internal = url.origin === window.location.origin
            || url.origin === "https://achievetogether.vercel.app";

        if (internal) {
            if (closeModal) setBlackout({ seted: false });
            navigate(url.pathname + url.search + url.hash);
        } else {
            setBlackout({
                seted: true,
                module: "LinkConfirm",
                options: { name: "link", url: url.href },
            });
        }

        return true;
    };
}
