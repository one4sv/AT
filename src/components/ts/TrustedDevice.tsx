import { useEffect, useRef } from "react";
import { useUser } from "../hooks/UserHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "./api";
export default function TrustedDevice() {
    const { user } = useUser();
    const { showNotification } = useNote();
    const pending = useRef(false);

    useEffect(
        () => {
            if (!user.id || pending.current || sessionStorage.getItem("at-trust-after-login") !== "1") return;
            pending.current = true;
            sessionStorage.removeItem("at-trust-after-login");
            api.post("auth/device").catch(
                () => showNotification("error", "Вход выполнен, но сохранить быстрый вход не удалось.")
            ).finally(
                () => {
                    pending.current = false;
                }
            );
        },
        [user.id, showNotification]
    );
    return null;
}
