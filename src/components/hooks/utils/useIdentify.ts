import { useState, useEffect } from "react";
import { identifyUser } from "../../ts/utils/identifyUser";

const identifyCache = new Map<string, { name: string; nick: string; avatar_url: string | null }>();

export function useIdentify(id: string | null | undefined) {
    const [ identified, setIdentified ] = useState<{ name: string; nick: string; avatar_url: string | null; } | null>(null);
    const [loadingIdentify, setLoadingIdentify] = useState(false);

    useEffect(() => {
        if (!id) {
            setIdentified(null);
            return;
        }
        const cached = identifyCache.get(id);
        if (cached) {
            setIdentified(cached);
            return;
        }
        setLoadingIdentify(true);
        identifyUser(id).then((acc) => {
            if (acc) {
                const userData = {
                    name: acc.name || acc.nick,
                    nick: acc.nick,
                    avatar_url: acc.avatar_url,
                };
                identifyCache.set(id, userData);
                setIdentified(userData);
            }
        })
        .finally(() => {
            setLoadingIdentify(false);
        });
    }, [id]);

    return { identified, loadingIdentify };
}