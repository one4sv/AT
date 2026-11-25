import { Fragment, type ReactNode } from "react";
import HighlightText from "../../../components/ts/HighlightText";
import SharedEntityCard from "./SharedEntityCard";
import { parseATEntityLink } from "../utils/parseATEntityLink";

export default function MessageLinkContent({text,search}: {text:string;search:string}) {
    const nodes: ReactNode[] = [];
    let cursor = 0;
    const pattern = /https?:\/\/[^\s<>"']+/gi;
    for (const match of text.matchAll(pattern)) {
        const href = match[0].replace(/[),.!?;:]+$/, "");
        const reference = parseATEntityLink(href);
        if (!reference) continue;
        const index = match.index ?? 0;
        if (index > cursor) nodes.push(<HighlightText key={"text"+cursor} text={text.slice(cursor,index)} search={search}/>);
        nodes.push(<SharedEntityCard key={"entity"+index} kind={reference.kind} id={reference.id} fallbackUrl={href}/>);
        cursor = index + href.length;
    }
    if (cursor === 0) return <HighlightText text={text} search={search}/>;
    if (cursor < text.length) nodes.push(<HighlightText key={"text"+cursor} text={text.slice(cursor)} search={search}/>);
    return <Fragment>{nodes}</Fragment>;
}
