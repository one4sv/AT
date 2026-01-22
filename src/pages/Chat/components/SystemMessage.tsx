import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import type { message } from "../../../components/context/ChatContext";
import { useIdentify } from "../../../components/hooks/utils/useIdentify";

interface SystemMessageType {
    m: message;
    answer?: { id: number; name: string; text: string };
    scrollToMessage?: (id: number) => void;
}

export default function SystemMessage({m, answer, scrollToMessage}: SystemMessageType) {
    const navigate = useNavigate();
    const { identified:targetAccount } = useIdentify(m.target_id?.toString())

    const parts = useMemo(() => {
        const split = m.content.split("{}");
        return split.length === 2
            ? { before: split[0], after: split[1] }
            : null;
    }, [m.content]);

    const displayTargetName = targetAccount
        ? (targetAccount.name || targetAccount.nick)
        : "пользователя";

    return (
        <div className="messageWrapper">
            <div className="systemMessage">
                <span className="systemMessageSender" onClick={() => navigate(`/acc/${m.sender_nick}`)}>
                    {m.sender_name}
                </span>
                &nbsp;
                {parts ? (
                    <span>
                        {parts.before}
                        <span className="systemMessageSender" onClick={() => targetAccount && targetAccount.nick && navigate(`/acc/${targetAccount.nick}`)
                        }>
                            {displayTargetName}
                        </span>
                        {parts.after}
                    </span>
                ) : (
                    <span>{m.content}</span>
                )}
                {answer && scrollToMessage && (
                    <div>
                        "<span className="systemMessageSender" onClick={() => scrollToMessage(answer.id)}>
                            {answer.text.length > 30
                                ? `${answer.text.slice(0, 30)}...`
                                : answer.text}
                        </span>"
                    </div>
                )}
            </div>
        </div>
    );
}
