import Linkify from "linkify-react";
import { Fragment, type ReactNode } from "react";
import useOpenLink from "../hooks/utils/useOpenLink";
import { LinkIcon } from "@phosphor-icons/react";


interface Props {
    text: string;
    search: string;
}

function highlightText(text: string, search: string): ReactNode[] {
    if (!search) return [text];
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));

    return parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
            <mark
                key={index}
                style={{
                    background: "var(--accent_highlight)",
                    color: "inherit",
                    borderRadius: "2px",
                }}
            >
                {part}
            </mark>
        ) : (
            <Fragment key={index}>{part}</Fragment>
        )
    );
}

export default function HighlightText({ text, search }: Props) {
    const openLink = useOpenLink();
    const query = search.trim();


    const linkifyOptions = {
        render: ({ attributes, content }: { attributes: { href?: string; [key: string]: unknown }; content: ReactNode }) => {
            const link = attributes.href ?? String(content);

            return (
                <a
                    {...attributes}
                    href={attributes.href}
                    onClick={event => {
                        event.stopPropagation();
                        if (openLink(link)) event.preventDefault();
                    }}
                >
                    <LinkIcon size={14} aria-hidden="true" style={{ verticalAlign: "-2px", marginInlineEnd: 3 }} />
                    {content}
                </a>
            );
        },
    };

    if (!query) {
        return (
            <span style={{ whiteSpace: "pre-wrap" }}>
                <Linkify options={linkifyOptions}>{text}</Linkify>
            </span>
        );
    }

    const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+/gi;
    const elements: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            elements.push(
                ...highlightText(text.slice(lastIndex, match.index), query).map(
                    (node, index) => (
                        <Fragment key={`text-${lastIndex}-${index}`}>{node}</Fragment>
                    )
                )
            );
        }

        const url = match[0];

        elements.push(
            <Linkify key={`url-${match.index}`} options={linkifyOptions}>
                {url}
            </Linkify>
        );

        lastIndex = match.index + url.length;
    }

    if (lastIndex < text.length) {
        elements.push(
            ...highlightText(text.slice(lastIndex), query).map((node, index) => (
                <Fragment key={`text-${lastIndex}-${index}`}>{node}</Fragment>
            ))
        );
    }

    return (
        <span style={{ whiteSpace: "pre-wrap" }}>
            {elements}
        </span>
    );
}