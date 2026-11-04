import { CircleUserRound, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import type { chatWithType } from "../../../components/context/ChatContext";

export default function WelcomeMessage({ person, text }: { person: chatWithType; text: string }) {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();

    return (
        <div className="welcomeMessageRow">
            <div className="welcomeMessageAvatar">
                {person.avatar_url
                    ? <img src={person.avatar_url} alt=""/>
                    : <CircleUserRound aria-hidden="true"/>
                }
            </div>
            <div className="welcomeMessageContent">
                <span className="welcomeMessageAuthor">{person.name || person.nick}</span>
                <div className="message ur welcomeMessageBubble">
                    <div className="messageText">{text}</div>
                </div>
                <button
                    type="button"
                    className="welcomeMessageBadge"
                    onClick={() => setBlackout({ seted: true, module: "WelcomeMessageInfo" })}
                >
                    <Info size={15}/>
                    {t("chats.welcomeBadge")}
                </button>
            </div>
        </div>
    );
}
