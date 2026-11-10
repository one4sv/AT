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

export default function ReactionIcon({ value, size = 18 }: { value: string; size?: number }) {
    const Icon = icons[value] || Heart;
    return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}
