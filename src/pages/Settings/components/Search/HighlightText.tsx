interface Props {
    text: string;
    search: string;
}

export default function HighlightText({ text, search }: Props) {
    const query = search.trim();

    if (!query) return <>{text}</>;

    return (
        <span>
            {text
                .split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
                .map((part, index) =>
                    part.toLowerCase() === query.toLowerCase() ? (
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
                        <span key={index} style={{ whiteSpace: "pre-wrap" }}>{part}</span>
                    )
                )}
        </span>
    );
}