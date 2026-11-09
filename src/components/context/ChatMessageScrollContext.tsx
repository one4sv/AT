import { createContext, useCallback, useRef, useState, type ReactNode, type SetStateAction } from "react";
import { useChat } from "../hooks/ChatHook";

interface ChatMessageScrollContextType {
    highlightedId: number | null;
    messageRefs: React.MutableRefObject<Map<number, HTMLDivElement | null>>;
    scrollToMessage: (targetId: number) => Promise<void>;
    setHighlightedId: React.Dispatch<SetStateAction<number | null>>
}

const ChatMessageScrollContext = createContext<ChatMessageScrollContextType | null>(null);

export const ChatMessageScrollProvider = ({ children }: { children: ReactNode }) => {
    const { loadAroundMessage } = useChat();

    const [ highlightedId, setHighlightedId ] = useState<number | null>(null);
    
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const highlightTimeoutRef = useRef<number | null>(null);

    const scrollToMessage = useCallback(
        async (targetId: number) => {
            const existingEl = messageRefs.current.get(targetId);

            if (existingEl) {
                if (highlightTimeoutRef.current) {
                    clearTimeout(highlightTimeoutRef.current);
                }

                setHighlightedId(targetId);
                existingEl.scrollIntoView({ behavior: "smooth", block: "center" });

                highlightTimeoutRef.current = window.setTimeout(() => {
                    setHighlightedId(null);
                    highlightTimeoutRef.current = null;
                }, 2000);

                return;
            }

            const success = await loadAroundMessage(targetId);

            if (!success) return;

            // React can commit the loaded history after the next two frames under load.
            // Keep the jump pending until the target is actually mounted.
            await new Promise<void>(resolve => {
                let attempts = 0;
                const focusTarget = () => {
                    const el = messageRefs.current.get(targetId);

                    if (!el?.isConnected) {
                        if (++attempts < 30) requestAnimationFrame(focusTarget);
                        else resolve();
                        return;
                    }

                    if (highlightTimeoutRef.current) {
                        clearTimeout(highlightTimeoutRef.current);
                    }

                    setHighlightedId(targetId);
                    el.scrollIntoView({ behavior: "smooth", block: "center" });

                    highlightTimeoutRef.current = window.setTimeout(() => {
                        setHighlightedId(null);
                        highlightTimeoutRef.current = null;
                    }, 2000);
                    resolve();
                };

                requestAnimationFrame(focusTarget);
            });
        },
        [loadAroundMessage]
    );

    return (
        <ChatMessageScrollContext.Provider
            value={{
                highlightedId,
                messageRefs,
                scrollToMessage,
                setHighlightedId
            }}
        >
            {children}
        </ChatMessageScrollContext.Provider>
    );
}
export default ChatMessageScrollContext