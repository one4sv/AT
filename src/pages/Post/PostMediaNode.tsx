import { createContext, useContext } from "react";
import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { XIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { PostMedia } from "./RichPost";
import useImagePreview from "../../components/hooks/utils/useImagePreview";

export const PostMediaContext = createContext<PostMedia[]>([]);

function MediaView({ node, deleteNode }: NodeViewProps) {
    const media = useContext(PostMediaContext);
    const openImage = useImagePreview(media);
    const { t } = useTranslation("acc");
    const file = media.find(item => (item.id || item.url) === node.attrs.id);

    return (
        <NodeViewWrapper className="postInlineMedia" contentEditable={false}>
            {file && (file.type.startsWith("image/") ? (
                <img src={file.url} alt={file.name} onClick={event => openImage(file, event)} />
            ) : file.type.startsWith("video/") ? (
                <video src={file.url} controls />
            ) : file.type.startsWith("audio/") ? (
                <audio src={file.url} controls />
            ) : <span>
                {file.name}
            </span>)}
            <button
                type="button"
                onClick={deleteNode}
                aria-label={t("editor.removeFile")}
            >
                <XIcon />
            </button>
        </NodeViewWrapper>
    );
}

export const PostMediaNode = Node.create({
    name: "postMedia",
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
        return { id: { default: null } };
    },
    parseHTML() {
        return [{ tag: "div[data-post-media]", getAttrs: element => ({ id: element.getAttribute("data-post-media") }) }];
    },
    renderHTML({ node }) {
        return ["div", { "data-post-media": node.attrs.id }];
    },
    addNodeView() {
        return ReactNodeViewRenderer(MediaView);
    }
});
