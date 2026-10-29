import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import { GearIcon, PaperclipIcon, PaperPlaneRightIcon, XIcon } from "@phosphor-icons/react";
import { api } from "../../components/ts/api";
import { useUser } from "../../components/hooks/UserHook";
import { useAcc } from "../../components/hooks/AccHook";
import { useSettings } from "../../components/hooks/SettingsHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import type { PostType } from "../../components/context/AccContext";
import PageBottom from "../../components/ts/PageBottom";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { PostMediaContext, PostMediaNode } from "./PostMediaNode";
import { mediaIds, type PostMedia } from "./RichPost";
import PostToolbar from "./PostToolbar";
import PostEditorSkeleton from "./PostEditorSkeleton";
import "../../scss/Post.scss";
import "./scss/postPage.scss";
import "./scss/postEditor.scss";

interface DraftMedia extends PostMedia {
    file?: File;
    inline?: boolean;
}

export default function PostEditor() {
    const { postId } = useParams();
    const { t } = useTranslation("acc");
    const { user, loadingUser } = useUser();
    const { refetchPosts } = useAcc();
    const { settingsLoaded } = useSettings();
    const { blackout, setBlackout, setBlackoutStack } = useBlackout();
    const { setTitle } = usePageTitle();

    const navigate = useNavigate();

    const [ media, setMedia ] = useState<DraftMedia[]>([]);
    const [ habit, setHabit ] = useState("none");
    const [ visibility, setVisibility ] = useState("inherit");
    const [ insert, setInsert ] = useState(false);
    const [ caretTop, setCaretTop ] = useState(6);
    const [ loading, setLoading ] = useState(!!postId);
    const [ sending, setSending ] = useState(false);
    const [ error, setError ] = useState("");
    const [ retry, setRetry ] = useState(0);
    
    const sendingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const areaRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef(1);
    const inlineRef = useRef(true);
    const urlsRef = useRef<string[]>([]);
    const addFilesRef = useRef<(files: File[], inline: boolean, position?: number) => void>(() => { });
    const title = t(postId ? "post.edit" : "post.create");

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2] },
                codeBlock: false,
                horizontalRule: false,
                link: {
                    openOnClick: false,
                    defaultProtocol: "https",
                    isAllowedUri: url => /^(https?:\/\/|\/(?!\/))/i.test(url)
                }
            }),
            PostMediaNode
        ],
        content: { type: "doc", content: [{ type: "paragraph" }] },
        editorProps: {
            attributes: { class: "postRichInput", role: "textbox", "aria-multiline": "true" },
            handlePaste: (view, event) => {
                const files = Array.from(event.clipboardData?.files || []);
                if (!files.length) return false;
                event.preventDefault();
                addFilesRef.current(files, true, view.state.selection.from);
                return true;
            },
            handleDrop: (view, event, _slice, moved) => {
                const files = Array.from(event.dataTransfer?.files || []);
                if (moved || !files.length) return false;
                event.preventDefault();
                event.stopPropagation();
                const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                addFilesRef.current(files, true, position);
                return true;
            }
        },
        onSelectionUpdate: ({ editor: current }) => {
            positionRef.current = current.state.selection.from;
            const rect = areaRef.current?.getBoundingClientRect();
            if (!rect || !current.isInitialized || !areaRef.current?.offsetHeight) return;
            const coords = current.view.coordsAtPos(current.state.selection.from);
            setCaretTop(Math.max(0, (coords.top - rect.top) / window.innerHeight * 100));
        }
    });
    const content = useEditorState({ editor, selector: context => context.editor?.getJSON() });
    const inlineIds = mediaIds(content);
    const attachments = media.filter(file => !file.inline && !inlineIds.includes(file.id || file.url));
    const hasContent = !!editor?.getText().trim() || !!inlineIds.length || !!attachments.length;

    useEffect(() => {
        return () => setBlackoutStack(previous => previous.filter(item => item.module !== "PostSettings"));
    }, [postId, setBlackoutStack]);

    useEffect(() => {
        setTitle(title);
    }, [setTitle, title]);

    useEffect(() => {
        if (!loadingUser && !user.id) navigate("/sign", { replace: true });
    }, [loadingUser, user.id, navigate]);

    useEffect(() => {
        editor?.setEditable(!loading && !sending && error !== "post.loadFailed");
    }, [editor, loading, sending, error]);

    useEffect(() => {
        return () => urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    }, []);

    useEffect(() => {
        if (!editor || !user.id) return;
        const controller = new AbortController();
        setMedia([]);
        setHabit("none");
        setVisibility("inherit");
        setError("");
        setLoading(!!postId);
        editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] });
        if (!postId) return;

        api.get(`post/${postId}`, { signal: controller.signal }).then(res => {
            if (controller.signal.aborted) return;
            const post: PostType = res.data.post;
            if (post.user.id !== user.id) {
                navigate(`/post/${postId}`, { replace: true });
                return;
            }
            const document: JSONContent = post.content || {
                type: "doc",
                content: (post.text || "").split("\n").map(text => ({
                    type: "paragraph",
                    content: text ? [{ type: "text", text }] : []
                }))
            };
            const ids = mediaIds(document);
            setMedia((post.media || []).map(file => ({
                ...file,
                inline: ids.includes(file.id || file.url)
            })));
            setHabit(post.habit ? String(post.habit.id) : "none");
            setVisibility(post.visibility || "inherit");
            editor.commands.setContent(document);
        }).catch(() => {
            if (!controller.signal.aborted) setError("post.loadFailed");
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });

        return () => controller.abort();
    }, [editor, postId, user.id, navigate, retry]);

    useEffect(() => {
        if (!editor || loading || !areaRef.current) return;
        const measure = () => {
            if (editor.isDestroyed || !editor.isInitialized || !areaRef.current?.offsetHeight) return;
            const rect = areaRef.current.getBoundingClientRect();
            const coords = editor.view.coordsAtPos(editor.state.selection.from);
            setCaretTop(Math.max(0, (coords.top - rect.top) / window.innerHeight * 100));
        };
        const observer = new ResizeObserver(measure);
        observer.observe(areaRef.current);
        editor.on("update", measure);
        window.addEventListener("resize", measure);
        return () => {
            observer.disconnect();
            editor.off("update", measure);
            window.removeEventListener("resize", measure);
        };
    }, [editor, loading]);

    const addFiles = (files: File[], inline: boolean, position = positionRef.current) => {
        if (!editor || sendingRef.current || loading) return;
        if (files.some(file => file.size > 100 * 1024 * 1024) || attachments.length + inlineIds.length + files.length > 20) {
            setError("editor.fileLimit");
            return;
        }
        setError("");
        const added = files.map(file => {
            const url = URL.createObjectURL(file);
            urlsRef.current.push(url);
            return { id: crypto.randomUUID(), url, name: file.name, type: file.type, message_id: "", file, inline };
        });
        setMedia(previous => [...previous, ...added]);
        if (inline) {
            editor.chain().focus().insertContentAt(
                Math.min(position, editor.state.doc.content.size),
                [...added.map(file => ({ type: "postMedia", attrs: { id: file.id } })), { type: "paragraph" }]
            ).run();
        }
        setInsert(false);
    };
    addFilesRef.current = addFiles;

    const chooseFiles = (inline: boolean) => {
        inlineRef.current = inline;
        inputRef.current?.click();
    };

    const openSettings = () => {
        setBlackout({
            seted: true,
            module: "PostSettings",
            postSettings: {
                visibility,
                habit,
                setVisibility: value => {
                    if (!sendingRef.current) setVisibility(value);
                },
                setHabit: value => {
                    if (!sendingRef.current) setHabit(value);
                }
            }
        });
    };

    const goBack = () => {
        if (window.history.state?.idx > 0) navigate(-1);
        else navigate(postId ? `/post/${postId}` : "/");
    };

    const sendPost = async () => {
        if (!editor || !user.id || loading || !settingsLoaded || error === "post.loadFailed" || sendingRef.current || !hasContent) return;
        sendingRef.current = true;
        setSending(true);
        setError("");
        const data = new FormData();
        const document = editor.getJSON();
        const ids = mediaIds(document);
        const kept = media.filter(file => !file.inline || ids.includes(file.id || file.url));
        const files = kept.filter(file => file.file);
        data.append("text", editor.getText({ blockSeparator: "\n" }).trim());
        data.append("content", JSON.stringify(document));
        data.append("visibility", visibility);
        data.append("habit_id", habit);
        data.append("media_ids", JSON.stringify(files.map(file => file.id)));
        if (postId) {
            data.append("id", postId);
            data.append("keptMedia", JSON.stringify(kept.filter(file => !file.file)));
        }
        files.forEach(file => data.append("media", file.file!));

        try {
            const res = await api.post(postId ? "uppost" : "addpost", data);
            if (!res.data.success) throw new Error("Post not saved");
            if (user.nick) void refetchPosts(user.nick);
            navigate(`/post/${postId || res.data.post_id}`, { replace: true });
        } catch {
            setError("post.saveFailed");
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    return (
        <>
            {(loading || !editor) && <PostEditorSkeleton onBack={goBack} />}
            <div className="postPage postEditor" style={{ display: loading || !editor ? "none" : undefined }}>
                <div className="postPageScroll">
                    {error && <div className="postStatus" role="alert">
                        {t(error)}
                        {error === "post.loadFailed" && (
                            <button type="button" onClick={() => setRetry(value => value + 1)}>
                                {t("post.retry")}
                            </button>
                        )}
                    </div>}
                    {editor && error !== "post.loadFailed" && <PostToolbar editor={editor} disabled={sending} />}
                    {editor && error !== "post.loadFailed" && (
                        <div className="postTA" ref={areaRef}>
                            <PostMediaContext.Provider value={media}>
                                <EditorContent
                                    editor={editor}
                                    className={editor?.isEmpty ? "postEditorEmpty" : ""}
                                    data-placeholder={t("editor.placeholder")}
                                />
                            </PostMediaContext.Provider>
                            <div className="postInsert" style={{ top: `${caretTop}vh` }}>
                                <button
                                    type="button"
                                    disabled={sending}
                                    aria-label={t("editor.addFile")}
                                    aria-expanded={insert}
                                    onMouseDown={event => event.preventDefault()}
                                    onClick={() => setInsert(value => !value)}
                                >
                                    <PaperclipIcon size={20}/>
                                </button>
                                {insert && <div className="postInsertOptions">
                                    <button type="button" onClick={() => chooseFiles(true)}>
                                        {t("editor.inline")}
                                    </button>
                                    <button type="button" onClick={() => chooseFiles(false)}>
                                        {t("editor.attachment")}
                                    </button>
                                </div>}
                            </div>
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                hidden
                                onChange={event => {
                                    addFiles(Array.from(event.target.files || []), inlineRef.current);
                                    event.target.value = "";
                                }}
                            />
                            {!!attachments.length && <div className="postAttachments">
                                {attachments.map(file => (
                                    <div key={file.id || file.url}>
                                        {file.type.startsWith("image/") && <img src={file.url} alt="" />}
                                        <span>
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={sending}
                                            aria-label={t("editor.removeFile")}
                                            onClick={() => setMedia(previous => previous.filter(item => item !== file))}
                                        >
                                            <XIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>}
                        </div>
                    )}
                </div>
                <PageBottom onBack={goBack}>
                    <button
                        type="button"
                        className="pageBottomAction"
                        onClick={openSettings}
                        aria-expanded={blackout.module === "PostSettings"}
                        disabled={loading || sending || error === "post.loadFailed"}
                    >
                        <GearIcon weight="fill" color="var(--accent)" />
                        {t("editor.settings")}
                    </button>
                    <div
                        className="chatWriteTAButt"
                        onClick={sendPost}
                        aria-label={t(postId ? "editor.save" : "editor.publish")}
                    >
                        <PaperPlaneRightIcon className="chatSend" weight="fill" />
                    </div>
                </PageBottom>
            </div>
        </>
    );
}
