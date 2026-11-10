import "../../scss/reactionPicker.scss";
import { useTranslation } from "react-i18next";
import { reactionsArr } from "./utils/emojies";
import ReactionIcon from "./ReactionIcon";

export default function ReactionPicker({
    activeReactions = [],
    onSelect,
    compact = false
}: {
    activeReactions?: string[];
    onSelect: (reaction: string) => void;
    compact?: boolean;
}) {
    const { t } = useTranslation("common");

    return (
        <div
            className={`reactionPicker ${compact ? "compact" : ""}`}
            role="group"
            aria-label={t("chatUi.chooseReaction")}
            onClick={event => event.stopPropagation()}
            onDoubleClick={event => event.stopPropagation()}
        >
            {reactionsArr.map(reaction => (
                <button
                    key={reaction.value}
                    type="button"
                    className={`reactionPickerItem ${activeReactions.includes(reaction.value) ? "active" : ""}`}
                    title={t(`reactions.${reaction.value}`)}
                    aria-label={t(`reactions.${reaction.value}`)}
                    aria-pressed={activeReactions.includes(reaction.value)}
                    onClick={event => {
                        event.stopPropagation();
                        onSelect(reaction.value);
                    }}
                >
                    <ReactionIcon value={reaction.value} size={18} />
                </button>
            ))}
        </div>
    );
}
