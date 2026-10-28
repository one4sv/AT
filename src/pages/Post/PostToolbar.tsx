import { useState } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { TextBIcon, TextItalicIcon, TextUnderlineIcon, TextStrikethroughIcon, CodeIcon, TextHIcon, QuotesIcon, ListBulletsIcon, ListNumbersIcon, LinkSimpleIcon, ArrowCounterClockwiseIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";

export default function PostToolbar({ editor, disabled }: { editor: Editor | null; disabled: boolean }) {
    const { t } = useTranslation("acc");
    const [ link, setLink ] = useState<string | null>(null);
    const [ invalid, setInvalid ] = useState(false);
    useEditorState({ editor, selector: context => context.editor?.state });
    if (!editor) return null;

    const actions = [
        { name: "bold", icon: TextBIcon, run: () => editor.chain().focus().toggleBold().run() },
        { name: "italic", icon: TextItalicIcon, run: () => editor.chain().focus().toggleItalic().run() },
        { name: "underline", icon: TextUnderlineIcon, run: () => editor.chain().focus().toggleUnderline().run() },
        { name: "strike", icon: TextStrikethroughIcon, run: () => editor.chain().focus().toggleStrike().run() },
        { name: "code", icon: CodeIcon, run: () => editor.chain().focus().toggleCode().run() },
        { name: "heading", icon: TextHIcon, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { name: "blockquote", icon: QuotesIcon, run: () => editor.chain().focus().toggleBlockquote().run() },
        { name: "bulletList", icon: ListBulletsIcon, run: () => editor.chain().focus().toggleBulletList().run() },
        { name: "orderedList", icon: ListNumbersIcon, run: () => editor.chain().focus().toggleOrderedList().run() },
        {
            name: "link", icon: LinkSimpleIcon, run: () => {
                setInvalid(false);
                setLink(editor.getAttributes("link").href || "");
            }
        },
        { name: "undo", icon: ArrowCounterClockwiseIcon, run: () => editor.chain().focus().undo().run() },
        { name: "redo", icon: ArrowClockwiseIcon, run: () => editor.chain().focus().redo().run() }
    ];

    const applyLink = () => {
        const href = link?.trim() || "";
        if (href && !/^(https?:\/\/|\/(?!\/))/i.test(href)) {
            setInvalid(true);
            return;
        }
        if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        else editor.chain().focus().extendMarkRange("link").unsetLink().run();
        setLink(null);
    };

    return (
        <div className="postToolbar">
            <div role="toolbar" aria-label={t("editor.formatting")}>
                {actions.map(action => (
                    <button
                        key={action.name}
                        type="button"
                        title={t(`editor.${action.name}`)}
                        aria-label={t(`editor.${action.name}`)}
                        aria-pressed={editor.isActive(action.name)}
                        disabled={disabled}
                        onMouseDown={event => event.preventDefault()}
                        onClick={action.run}
                    >
                        <action.icon />
                    </button>
                ))}
            </div>
            {link !== null && <div className="postLinkInput">
                <input
                    value={link}
                    onChange={event => setLink(event.target.value)}
                    placeholder="https://"
                    aria-label={t("editor.link")}
                    aria-invalid={invalid}
                    onKeyDown={event => {
                        if (event.key === "Enter") applyLink();
                        if (event.key === "Escape") setLink(null);
                    }}
                />
                <button type="button" onClick={applyLink}>
                    {t("editor.apply")}
                </button>
                <button type="button" onClick={() => setLink(null)}>
                    {t("editor.close")}
                </button>
                {invalid && <span role="alert">
                    {t("editor.invalidLink")}
                </span>}
            </div>}
        </div>
    );
}
