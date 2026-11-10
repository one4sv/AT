import {
    Heart, ThumbsUp, ThumbsDown, Laugh, Eye, Flame, PartyPopper, Hand,
    HandHeart, BadgeCheck, Frown, Angry, Brain, Sparkles, Lightbulb, Smile,
    type LucideIcon
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
    Heart,
    Like: ThumbsUp,
    Laugh,
    Wow: Eye,
    Fire: Flame,
    Party: PartyPopper,
    Clap: Hand,
    Thanks: HandHeart,
    Hundred: BadgeCheck,
    Dislike: ThumbsDown,
    Cry: Frown,
    Angry,
    Thinking: Brain,
    Celebrate: Sparkles,
    MindBlown: Lightbulb,
    LoveEyes: Smile
};

const colors: Record<string, string> = {
    Heart: "#ff6384",
    Like: "#60a5fa",
    Dislike: "#a78bfa",
    Laugh: "#fbbf24",
    Wow: "#f9a84d",
    Fire: "#ff794f",
    Party: "#b794f6",
    Clap: "#eab65b",
    Thanks: "#fb8fb6",
    Hundred: "#ff7180",
    Cry: "#73bcfa",
    Angry: "#fb6868",
    Thinking: "#a6a5f3",
    Celebrate: "#ce91f4",
    MindBlown: "#54d6bf",
    LoveEyes: "#f978b4"
};

export default function ReactionIcon({ value, size = 18 }: { value: string; size?: number }) {
    const Icon = icons[value] || Heart;
    return <Icon
        size={size}
        strokeWidth={1.9}
        fill={value === "Heart" ? "currentColor" : "none"}
        style={{ color: colors[value] || "var(--accent_text)" }}
        aria-hidden="true"
    />;
}
