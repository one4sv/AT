import { useState } from "react";
import { reactionsArr } from "./utils/emojies";

const illustrations: Record<string, string> = {
    Heart: "2764",
    Like: "1f44d",
    Laugh: "1f602",
    Wow: "1f62e",
    Fire: "1f525",
    Party: "1f389",
    Clap: "1f44f",
    Thanks: "1f64f",
    Hundred: "1f4af",
    Dislike: "1f44e",
    Cry: "1f622",
    Angry: "1f620",
    Thinking: "1f914",
    Celebrate: "1f973",
    MindBlown: "1f92f",
    LoveEyes: "1f60d"
};

// Fluent Emoji 3D (Microsoft, MIT): see docs/REACTION_ASSETS.md.
const baseUrl = "https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode@main/assets/";

export default function ReactionIcon({ value, size = 18 }: { value: string; size?: number }) {
    const file = illustrations[value] || illustrations.Heart;
    const src = `${baseUrl}${file}_3d.png`;
    const [ failedSrc, setFailedSrc ] = useState<string | null>(null);

    if (failedSrc === src) {
        return (
            <span className="reactionIllustrationFallback" aria-hidden="true" style={{ fontSize: size }}>
                {reactionsArr.find(reaction => reaction.value === value)?.label || "❤️"}
            </span>
        );
    }

    return (
        <img
            className="reactionIllustration"
            src={src}
            alt=""
            width={size}
            height={size}
            decoding="async"
            draggable={false}
            onError={() => setFailedSrc(src)}
        />
    );
}
