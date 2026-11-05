import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import localizeSystemMessage from "./localizeSystemMessage";
import type { message } from "../../../components/context/ChatContext";
import { useIdentify } from "../../../components/hooks/utils/useIdentify";
import { isMobile } from "react-device-detect";

interface SystemMessageType {
    m: message;
    answer?: { id: number; name: string; text: string };
    scrollToMessage?: (id: number) => void;
}

export default function SystemMessage({m, answer, scrollToMessage}: SystemMessageType) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { identified:targetAccount } = useIdentify(m.target_id?.toString())

    const content = localizeSystemMessage(m.content);
    const split = content.split("{}");
    const parts = split.length === 2
        ? { before: split[0], after: split[1] }
        : null;

    const displayTargetName = targetAccount
        ? (targetAccount.name || targetAccount.nick)
        : t("chatUi.user");

    return (
        <div className="messageWrapper">
            <div className={`systemMessage ${isMobile && "mobile"}`}>
                <span className="systemMessageSender" onClick={() => navigate(`/acc/${m.sender_nick}`)}>
                    {m.sender_name}
                </span>
                {parts ? (
                    <span>
                        {parts.before}
                        <span className="systemMessageSender" onClick={() => targetAccount && targetAccount.nick && navigate(`/acc/${targetAccount.nick}`)}>
                            {displayTargetName}
                        </span>
                        {parts.after}
                    </span>
                ) : (
                    <span>{content}</span>
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
