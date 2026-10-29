import { Fragment, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { LinkSimpleIcon } from "@phosphor-icons/react";
import type { Media } from "../../components/context/ChatContext";
import HighlightText from "../../components/ts/HighlightText";
import useOpenLink from "../../components/hooks/utils/useOpenLink";
import AccPostMedia from "../Acc/utils/AccPostMedia";

export interface PostMedia extends Media {
    id?: string;
}

export function mediaIds(content?: JSONContent | null): string[] {
    if (!content) return [];
    if (content.type === "postMedia") return [content.attrs?.id];
    return (content.content || []).flatMap(mediaIds);
}

export default function RichPost({ content, media }: { content: JSONContent; media: PostMedia[] }) {
    const openLink = useOpenLink();

    const render = (node: JSONContent, index: number): ReactNode => {
        const children = node.content?.map(render);
        if (node.type === "text") {
            let text: ReactNode = <HighlightText text={node.text || ""} search="" />;
            if (node.marks?.some(mark => mark.type === "link")) text = node.text;
            for (const mark of node.marks || []) {
                if (mark.type === "bold") text = <strong>
                    {text}
                </strong>;
                if (mark.type === "italic") text = <em>
                    {text}
                </em>;
                if (mark.type === "underline") text = <u>
                    {text}
                </u>;
                if (mark.type === "strike") text = <s>
                    {text}
                </s>;
                if (mark.type === "code") text = <code>
                    {text}
                </code>;
                if (mark.type === "link" && /^(https?:\/\/|mailto:|\/)/i.test(mark.attrs?.href || "")) {
                    const href = mark.attrs!.href as string;
                    text = (
                        <a href={href} onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            openLink(href);
                        }}>
                            <LinkSimpleIcon />{text}
                        </a>
                    );
                }
            }
            return (
                <Fragment key={index}>
                    {text}
                </Fragment>
            );
        }
        switch (node.type) {
            case "paragraph": return (
                <p key={index}>
                    {children?.length ? children : <br />}
                </p>
            );
            case "heading": return (
                <h2 key={index}>
                    {children}
                </h2>
            );
            case "blockquote": return (
                <blockquote key={index}>
                    {children}
                </blockquote>
            );
            case "bulletList": return (
                <ul key={index}>
                    {children}
                </ul>
            );
            case "orderedList": return (
                <ol key={index}>
                    {children}
                </ol>
            );
            case "listItem": return (
                <li key={index}>
                    {children}
                </li>
            );
            case "hardBreak": return (
                <br key={index} />
            );
            case "postMedia": return (
                <AccPostMedia
                    key={index}
                    red={false}
                    gallery={media}
                    media={media.filter(file => (file.id || file.url) === node.attrs?.id)}
                />
            );
            default: return (
                <Fragment key={index}>
                    {children}
                </Fragment>
            );
        }
    };

    return (
        <div className="richPost">
            {render(content, 0)}
        </div>
    );
}
