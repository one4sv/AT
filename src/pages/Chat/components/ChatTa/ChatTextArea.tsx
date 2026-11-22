import { useTranslation } from "react-i18next";
import TA from "../../../../components/ts/TA";
import MediaDraft from "../../../../components/ts/MediaDraft";
import { Paperclip, PaperPlaneRightIcon, X, CheckCircleIcon, CalendarPlusIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { useLocation, useParams } from "react-router";
import { useChat } from "../../../../components/hooks/ChatHook";
import { isMobile } from "react-device-detect";
import { useDrop } from "../../../../components/hooks/DropHook";
import { useMessages } from "../../../../components/hooks/MessagesHook";
import { MessBarBlock } from "../../utils/MessBarBlock";
import type { Media, message } from "../../../../components/context/ChatContext";
import { useSendMess } from "../../../../components/hooks/SendMessHook";
import { useUser } from "../../../../components/hooks/UserHook";
import { useNote } from "../../../../components/hooks/NoteHook";
import EmojiButton from "../../../../components/ts/utils/EmojiButton";
import EntitySuggestionList, { type EntitySuggestionItem } from "../../../../components/ts/EntitySuggestionList";
import { isQuickCreateCommand, parseQuickCreateCommand, quickCommandOnSpace } from "../../../../components/ts/utils/quickCreateCommand";
import QuickCommandComposer, { type QuickCommandDraft } from "./QuickCommandComposer";
import { api } from "../../../../components/ts/api";
import { todayStrFunc, resolveTimeZone } from "../../../../components/ts/utils/dateToStr";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { findMentionToken } from "../../../../components/ts/utils/chatMentions";
import type { LinkedEntity } from "../../../../components/context/SendMessContext";
import { useNavigate } from "react-router";
interface FailedChatDraft {
    key: number;
    route: string;
    receiver: { nick?: string; id?: string };
    text: string;
    files: File[];
    answerId?: string;
    redirect?: message[];
    showNames: boolean;
    linkedEntity?: LinkedEntity;
}

const failedChatDrafts = new Map<string, FailedChatDraft[]>();
let nextFailedDraftId = 0;

interface ChatTABgProps {
    textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
    scrollToMessage: (id: number) => void;
    mess: string;
    setMess: React.Dispatch<SetStateAction<string>>;
    showEmojiBar: boolean;
    setShowEmojiBar: React.Dispatch<SetStateAction<boolean>>;
    emojiButtRef: React.RefObject<HTMLDivElement | null>;
}
export default function ChatTextArea({
    textAreaRef,
    scrollToMessage,
    mess,
    setMess,
    setShowEmojiBar,
    showEmojiBar,
    emojiButtRef
}: ChatTABgProps) {
    const {
        handleTyping,
        chatWith,
        chatLoading,
        stopTyping,
        setMessages
    } = useChat();
    const {
        sendMess,
        editMess
    } = useSendMess();
    const {
        nick,
        id
    } = useParams();
    const {
        droppedFiles,
        setDroppedFiles
    } = useDrop();
    const {
        forwardPost,
        setForwardPost,
        forwardMedia,
        setForwardMedia,
        answer,
        editing,
        setEditing,
        redirect,
        setRedirect,
        showNames,
        setShowNames,
        setChosenMess
    } = useMessages();
    const { user } = useUser();
    const { refetchHabits } = useHabits();
    const { upsertPlan, refreshPlans } = usePlans();
    const { timeZone } = useSettings();
    const { showNotification } = useNote();
    const { t } = useTranslation("acc");
    const { t: tc } = useTranslation("common");
    const sending = useRef(false);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const [mentionCaret, setMentionCaret] = useState(0);
    const [activeMention, setActiveMention] = useState(0);
    const [mentionDismissed, setMentionDismissed] = useState(false);
    const [linkedEntity, setLinkedEntity] = useState<(LinkedEntity & {label:string}) | null>(null);
    const [shareItems, setShareItems] = useState<EntitySuggestionItem[]>([]);
    const [activeShare, setActiveShare] = useState(0);
    const [sharePreview, setSharePreview] = useState<string | null>(null);
    const [shareDismissed, setShareDismissed] = useState(false);
    const navigate = useNavigate();
    const [previewCommand, setPreviewCommand] = useState<string | null>(null);
    const [commandListDismissed, setCommandListDismissed] = useState(false);
    const [quickDraft, setQuickDraft] = useState<QuickCommandDraft | null>(null);
    const [quickSending, setQuickSending] = useState(false);
    const quickSubmitting = useRef(false);
    const commandPopupRef = useRef<HTMLDivElement | null>(null);
    const commandRowRef = useRef<HTMLDivElement | null>(null);
    const commandSendRef = useRef<HTMLDivElement | null>(null);
    const createdQuick = useRef<{ kind: "habit" | "plan"; id: number } | null>(null);
    const savedChat = !id && !!nick && !!user.nick &&
        nick.toLowerCase() === user.nick.toLowerCase() && !chatWith?.is_group;
    const quickCommandItems: EntitySuggestionItem[] = [
        { id: "act", label: "/act", description: tc("chatUi.quickCommands.createActivity"), icon: <CheckCircleIcon size={24}/> },
        { id: "plan", label: "/plan", description: tc("chatUi.quickCommands.createPlan"), icon: <CalendarPlusIcon size={24}/> }
    ];
    const commandQuery = mess.trim();
    const matchingCommands = /^\/[a-z]*$/i.test(commandQuery)
        ? quickCommandItems.filter(item => item.label.startsWith(commandQuery.toLowerCase())) : [];
    const canShowCommands = savedChat && !quickDraft && !editing && !commandListDismissed && matchingCommands.length > 0;
    const shareCommands: EntitySuggestionItem[] = [
        {id:"habit",label:"/habit",description:tc("chatUi.shareActivity")},
        {id:"plan",label:"/plan",description:tc("chatUi.sharePlan")},
        {id:"post",label:"/post",description:tc("chatUi.sharePost")},
        {id:"user",label:"/user",description:tc("chatUi.shareUser")},
        {id:"group",label:"/group",description:tc("chatUi.shareGroup")},
        {id:"invite",label:"/invite",description:tc("chatUi.shareInvite")}
    ];
    const plainShare = !savedChat && !editing && !shareDismissed && /^\/[a-z]*$/i.test(mess)
        ? shareCommands.filter(item => item.label.startsWith(mess.toLowerCase())) : [];
    const shareMatch = !savedChat && !editing && !shareDismissed
        ? /^\/(habit|plan|post|user|group|invite)\s+(.{0,100})$/iu.exec(mess) : null;
    const shareSuggestions = shareMatch ? shareItems : plainShare;
    const chooseShare = (item: EntitySuggestionItem) => {
        if (!shareMatch) {
            setMess("/" + item.id + " ");
            setShareItems([]);
            setSharePreview(null);
            setActiveShare(0);
            requestAnimationFrame(() => textAreaRef.current?.focus({preventScroll:true}));
            return;
        }
        const separator = item.id.indexOf(":");
        const kind = item.id.slice(0, separator) as LinkedEntity["type"];
        const entityId = item.id.slice(separator + 1);
        if (shareMatch[1] === "group" && kind === "group") {
            navigate("/chat/g/" + entityId + "?invite=1");
            setMess("");
        } else if (shareMatch[1] === "invite") {
            if (kind === "habit" || kind === "plan") navigate("/" + kind + "/" + entityId + "?invite=1");
            setMess("");
        } else {
            setLinkedEntity({type:kind,id:entityId,label:item.label});
            setMess("");
        }
        setShareItems([]);
        setActiveShare(0);
        setSharePreview(null);
        setShareDismissed(true);
        requestAnimationFrame(() => textAreaRef.current?.focus({preventScroll:true}));
    };
    useEffect(() => {
        setShareItems([]);
        if (!shareMatch?.[2]?.trim()) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            const q = shareMatch[2].trim();
            const kinds = shareMatch[1] === "invite" ? ["habit","plan"] : [shareMatch[1]];
            void Promise.all(kinds.map(kind => api.get("search/global",{
                params:{q:"/"+kind+" "+q,page:0},signal:controller.signal
            }))).then(results => {
                if (controller.signal.aborted) return;
                setShareItems(results.flatMap(response => response.data?.items || [])
                    .filter((entry:{kind:string;id:string;label:string}) => entry.id && entry.label)
                    .map((entry:{kind:string;id:string;label:string}) => ({
                        id: entry.kind + ":" + entry.id, label: entry.label,
                        description: tc("sideMenu.searchFilter." + entry.kind)
                    })));
                setActiveShare(0);
            }).catch(() => { if (!controller.signal.aborted) setShareItems([]); });
        },250);
        return () => {window.clearTimeout(timer);controller.abort();};
    }, [mess, shareMatch?.[1], shareMatch?.[2]]);
    const mentionToken = !savedChat && !quickDraft && !editing && !mentionDismissed
        ? findMentionToken(mess, mentionCaret) : null;
    const mentionMembers = chatWith?.is_group ? chatWith.members || [] : chatWith
        ? [{ id: chatWith.id, nick: chatWith.nick, avatar_url: chatWith.avatar_url || "" }] : [];
    const matchingMentions: EntitySuggestionItem[] = mentionToken
        ? mentionMembers.filter(member => member.nick && member.id !== user.id &&
            member.nick.toLocaleLowerCase().startsWith(mentionToken.query.toLocaleLowerCase()))
            .slice(0, 15).map(member => ({
                id: member.nick,
                label: "@" + member.nick,
                description: tc("chatUi.mentionUser")
            })) : [];
    const commitMention = (member: EntitySuggestionItem) => {
        if (!mentionToken) return;
        const inserted = "@" + member.id + " ";
        const next = mess.slice(0, mentionToken.start) + inserted + mess.slice(mentionToken.end);
        const caret = mentionToken.start + inserted.length;
        setMess(next);
        setMentionCaret(caret);
        setActiveMention(0);
        setMentionDismissed(false);
        requestAnimationFrame(() => {
            textAreaRef.current?.focus({ preventScroll: true });
            textAreaRef.current?.setSelectionRange(caret, caret);
        });
    };
    const displayedMess = previewCommand || sharePreview || mess;
    const commitCommand = (id: string) => {
        const kind = id === "act" ? "habit" : "plan";
        const parsed = parseQuickCreateCommand(mess);
        const draft: QuickCommandDraft = parsed?.kind === kind ? {
            ...parsed,
            periodicity: parsed.periodicity || "everyday",
            date: parsed.date || todayStrFunc()
        } : {
            kind,
            periodicity: "everyday",
            date: todayStrFunc()
        };
        createdQuick.current = null;
        setQuickDraft(draft);
        setMess("");
        setPreviewCommand(null);
        setCommandListDismissed(true);
        setShowEmojiBar(false);
    };
    const cancelQuickCommand = () => {
        if (quickSending) return;
        createdQuick.current = null;
        setQuickDraft(null);
        setMess("");
        setPreviewCommand(null);
        setCommandListDismissed(false);
        requestAnimationFrame(() => textAreaRef.current?.focus({ preventScroll: true }));
    };
    const submitQuickCommand = async () => {
        if (!quickDraft || quickSubmitting.current || sending.current || !savedChat || !nick ||
            files.length || oldMedia.length || editing || redirect || forwardPost || forwardMedia) return;
        const name = quickDraft.name?.trim() || "";
        if (!name || (quickDraft.kind === "habit" && name.length > 40)) {
            showNotification("error", tc("chatUi.quickCommands.nameRequired"));
            return;
        }
        if (quickDraft.kind === "habit" && !quickDraft.periodicity) {
            showNotification("error", tc("chatUi.quickCommands.invalidPeriodicity"));
            return;
        }
        if (quickDraft.startTimeText?.trim() && !quickDraft.startTime) {
            showNotification("error", tc("habitUi.invalidStart"));
            return;
        }
        if (quickDraft.endTimeText?.trim() && !quickDraft.endTime) {
            showNotification("error", tc("habitUi.invalidEnd"));
            return;
        }
        if (quickDraft.startTime && quickDraft.endTime && quickDraft.endTime < quickDraft.startTime) {
            showNotification("error", tc("plans.invalidTime"));
            return;
        }
        if (quickDraft.kind === "plan" && (!quickDraft.date || !/^\d{4}-\d{2}-\d{2}$/.test(quickDraft.date))) {
            showNotification("error", tc("chatUi.quickCommands.dateRequired"));
            return;
        }
        if (quickDraft.kind === "habit" && quickDraft.periodicity === "weekly" &&
            !/^[0-6](?:\s*[,; ]\s*[0-6])*$/.test(quickDraft.weeklyDays || "")) {
            showNotification("error", tc("chatUi.quickCommands.invalidDays"));
            return;
        }
        if (quickDraft.kind === "habit" && quickDraft.periodicity === "cycle" &&
            (![quickDraft.cycleActive, quickDraft.cycleRest].every(value =>
                Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 365))) {
            showNotification("error", tc("habitUi.enterCycle"));
            return;
        }
        quickSubmitting.current = true;
        setQuickSending(true);
        try {
            let entity = createdQuick.current;
            if (!entity) {
                if (quickDraft.kind === "plan") {
                    const response = await api.post("plans", {
                        name,
                        description: quickDraft.description || "",
                        plan_date: quickDraft.date,
                        start_time: quickDraft.startTime || null,
                        end_time: quickDraft.endTime || null,
                        timezone: resolveTimeZone(timeZone),
                        place: "",
                        tag: quickDraft.tag || null,
                        kind: "personal",
                        completion_mode: "personal",
                        visibility: "inherit"
                    });
                    if (!response.data?.success || !response.data.plan?.id) throw new Error("Plan creation failed");
                    entity = { kind: "plan", id: Number(response.data.plan.id) };
                    createdQuick.current = entity;
                    upsertPlan({ ...response.data.plan, membership_status: "accepted",
                        is_owner: true, completed_for_me: false });
                    void refreshPlans().catch(() => {});
                } else {
                    const chosenDays = quickDraft.periodicity === "weekly"
                        ? [...new Set((quickDraft.weeklyDays || "").split(/[,; ]+/).map(Number))]
                        : null;
                    const response = await api.post("addhabit", {
                        name, desc: quickDraft.description || "",
                        startDate: new Date(), endDate: null, now: true,
                        periodicity: quickDraft.periodicity || "everyday",
                        chosenDays,
                        start_time: quickDraft.startTime || null,
                        end_time: quickDraft.endTime || null,
                        tag: quickDraft.tag || null,
                        cycle_days_active: quickDraft.periodicity === "cycle" ? Number(quickDraft.cycleActive) : null,
                        cycle_days_rest: quickDraft.periodicity === "cycle" ? Number(quickDraft.cycleRest) : null
                    });
                    if (!response.data?.success || !response.data.habit_id) {
                        throw new Error("Activity created without an ID");
                    }
                    entity = { kind: "habit", id: Number(response.data.habit_id) };
                    createdQuick.current = entity;
                    void refetchHabits().catch(() => {});
                }
            }
            const content = (entity.kind === "plan" ? tc("plans.added") : tc("chatUi.quickCommands.activityCreated")) +
                "\n" + new URL("/" + (entity.kind === "plan" ? "plan" : "habit") + "/" + entity.id, window.location.origin).href;
            const currentRoute = location.pathname;
            const sent = await sendMess({ nick }, content, [], undefined, undefined, undefined, confirmed => {
                if (routeRef.current !== currentRoute) return;
                setMessages(previous => {
                    const existingIds = new Set(previous.map(message => message.id));
                    return [...previous, ...confirmed.filter(message => !existingIds.has(message.id))];
                });
            });
            if (!sent) {
                showNotification("error", tc("chatUi.quickCommands.messageFailed"));
                return;
            }
            createdQuick.current = null;
            setQuickDraft(null);
            setMess("");
            setCommandListDismissed(false);
            showNotification("success", entity.kind === "plan" ? tc("plans.added") : tc("chatUi.quickCommands.activityCreated"));
        } catch {
            showNotification("error", tc("chatUi.quickCommands.createFailed"));
        } finally {
            quickSubmitting.current = false;
            setQuickSending(false);
        }
    };
    useEffect(() => {
        if (!canShowCommands && !quickDraft && !shareSuggestions.length) return;
        const dismiss = (event: PointerEvent) => {
            const target = event.target as Node;
            if (commandPopupRef.current?.contains(target) || commandSendRef.current?.contains(target)) return;
            if (quickDraft) {
                if (emojiButtRef.current?.contains(target) ||
                    (target instanceof Element && target.closest(".selectListPortalRoot, .react-datepicker-popper"))) return;
                cancelQuickCommand();
            } else if (shareSuggestions.length) {
                if (target instanceof Element && target.closest(".chatCommandEditor")) return;
                setShareDismissed(true);
                setSharePreview(null);
                if (mess.trim() === "/") setMess("");
            } else {
                // The editor is part of the active command input: keep suggestions
                // visible when the user taps inside TA to focus or move the caret.
                if (target instanceof Element && target.closest(".chatCommandEditor, .chatSlashButton")) return;
                setCommandListDismissed(true);
                setPreviewCommand(null);
                if (mess.trim() === "/") setMess("");
            }
        };
        document.addEventListener("pointerdown", dismiss, true);
        return () => document.removeEventListener("pointerdown", dismiss, true);
    }, [canShowCommands, quickDraft, quickSending, mess, emojiButtRef, setMess, shareSuggestions.length]);
    const routeRef = useRef("");
    const [oldMess, setOldMess] = useState<string>("");
    const [enterToSend, setEnterToSend] = useState(() => localStorage.getItem("at_chat_enter_to_send") !== "false");
    const [sendTypingStatus, setSendTypingStatus] = useState(() => localStorage.getItem("at_chat_send_typing") !== "false");
    const [files, setFiles] = useState<File[]>([]);
    const [oldFiles, setOldFiles] = useState<File[]>([]);
    const [oldMedia, setOldMedia] = useState<Media[]>([]);
    const location = useLocation();
    routeRef.current = location.pathname;
    const draftKey = `${user.id ?? "guest"}:${location.pathname}`;
    const [failedDrafts, setFailedDrafts] = useState<FailedChatDraft[]>(() => failedChatDrafts.get(draftKey) ?? []);
    const [retryingFailedId, setRetryingFailedId] = useState<number | null>(null);

    useEffect(() => {
        setFailedDrafts(failedChatDrafts.get(draftKey) ?? []);
        setRetryingFailedId(null);
    }, [draftKey]);
    useEffect(() => {
        createdQuick.current = null;
        setQuickDraft(null);
        setPreviewCommand(null);
        setCommandListDismissed(false);
        setActiveSuggestion(0);
        setMentionCaret(0);
        setMentionDismissed(false);
        setActiveMention(0);
        setLinkedEntity(null);
        setShareItems([]);
        setShareDismissed(false);
    }, [location.pathname, user.id]);
    useEffect(() => {
        const targetReady = !chatLoading && !!chatWith && (id
            ? chatWith.is_group && String(chatWith.id) === id
            : !chatWith.is_group && chatWith.nick === nick);
        if (!forwardMedia || forwardMedia.targetPath !== location.pathname || !targetReady) return;

        if (forwardMedia.isLink) {
            setMess(prev => [prev.trim(), forwardMedia.url].filter(Boolean).join("\n"));
            setForwardMedia(null);
            return;
        }

        const controller = new AbortController();
        const prepare = async () => {
            try {
                const response = await fetch(forwardMedia.url, {
                    credentials: "include",
                    signal: controller.signal
                });
                if (!response.ok) throw new Error("Media fetch failed");
                const blob = await response.blob();
                if (controller.signal.aborted) return;

                const file = new File([blob], forwardMedia.name || "media", {
                    type: forwardMedia.type || blob.type || "application/octet-stream"
                });
                setFiles(prev => [...prev, file]);
                setForwardMedia(null);
            } catch {
                if (controller.signal.aborted) return;
                showNotification("error", tc("chatUi.forwardMediaFailed"));
                setForwardMedia(null);
            }
        };

        void prepare();
        return () => controller.abort();
    }, [forwardMedia, location.pathname, chatLoading, chatWith, id, nick, setForwardMedia, setMess, showNotification, tc]);


    const removeFailedDraft = (key: number) => {
        const next = (failedChatDrafts.get(draftKey) ?? []).filter(draft => draft.key !== key);
        if (next.length) failedChatDrafts.set(draftKey, next);
        else failedChatDrafts.delete(draftKey);
        setFailedDrafts(next);
    };

    const retryFailedDraft = async (draft: FailedChatDraft) => {
        if (sending.current || retryingFailedId !== null) return;
        sending.current = true;
        setRetryingFailedId(draft.key);
        try {
            const success = await sendMess(
                draft.receiver,
                draft.text,
                draft.files,
                draft.answerId,
                draft.redirect,
                draft.showNames,
                confirmedMessages => {
                    if (routeRef.current !== draft.route) return;
                    setMessages(prev => {
                        const serverIds = new Set(confirmedMessages.map(message => message.id));
                        return [...prev.filter(message => !serverIds.has(message.id)), ...confirmedMessages];
                    });
                },
                draft.linkedEntity
            );
            if (success) {
                const next = (failedChatDrafts.get(draftKey) ?? []).filter(item => item.key !== draft.key);
                if (next.length) failedChatDrafts.set(draftKey, next);
                else failedChatDrafts.delete(draftKey);
                if (routeRef.current === draft.route) setFailedDrafts(next);
            }
        } finally {
            sending.current = false;
            setRetryingFailedId(null);
        }
    };

    useEffect(() => {
        const syncKeyboard = (event: StorageEvent) => {
            if (event.key === "at_chat_enter_to_send") setEnterToSend(event.newValue !== "false");
            if (event.key === "at_chat_send_typing") setSendTypingStatus(event.newValue !== "false");
        };
        window.addEventListener("storage", syncKeyboard);
        return () => window.removeEventListener("storage", syncKeyboard);
    }, []);
    const inputFileRef = useRef<HTMLInputElement>(null);

    useEffect(
        () => {
            if (editing !== null) {
                setOldMess(mess);
                setOldFiles(files);
                setMess(editing.text || "");
                setFiles([]);
                setOldMedia(editing.media ?? []);
            } else {
                setMess(oldMess);
                setFiles(oldFiles);
                setOldMedia([]);
            }
        },
        [editing]
    );
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (shareSuggestions.length && !e.nativeEvent.isComposing) {
            if (e.key === "Escape") {
                e.preventDefault();
                setShareDismissed(true);
                setSharePreview(null);
                return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setActiveShare(index => (index + (e.key === "ArrowDown" ? 1 : -1) +
                    shareSuggestions.length) % shareSuggestions.length);
                return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                chooseShare(shareSuggestions[Math.min(activeShare,shareSuggestions.length-1)]);
                return;
            }
        }
        if (matchingMentions.length && !e.nativeEvent.isComposing) {
            if (e.key === "Escape") {
                e.preventDefault();
                setMentionDismissed(true);
                return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setActiveMention(index => (index + (e.key === "ArrowDown" ? 1 : -1) +
                    matchingMentions.length) % matchingMentions.length);
                return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                commitMention(matchingMentions[Math.min(activeMention, matchingMentions.length - 1)]);
                return;
            }
        }
        if (savedChat && canShowCommands && !e.nativeEvent.isComposing) {
            if (e.key === "Escape") {
                e.preventDefault();
                setCommandListDismissed(true);
                setPreviewCommand(null);
                return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestion(index => (index + (e.key === "ArrowDown" ? 1 : -1) + matchingCommands.length) % matchingCommands.length);
                return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                commitCommand(matchingCommands[Math.min(activeSuggestion, matchingCommands.length - 1)].id);
                return;
            }
        }
        if (savedChat && isQuickCreateCommand(mess) && e.key === "Enter" &&
            !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            commitCommand(mess.trimStart().toLowerCase().startsWith("/act") ? "act" : "plan");
            return;
        }
        if (e.key !== "Enter" || isMobile || e.nativeEvent.isComposing) return;
        const send = enterToSend ? !e.shiftKey && !e.ctrlKey && !e.metaKey : e.ctrlKey || e.metaKey;
        if (send) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleSend = async () => {
        if (quickDraft) {
            void submitQuickCommand();
            return;
        }
        if (shareSuggestions.length) {
            chooseShare(shareSuggestions[Math.min(activeShare,shareSuggestions.length - 1)]);
            return;
        }
        if (shareMatch || plainShare.length) {
            showNotification("info",tc("chatUi.shareSearchHint"));
            return;
        }
        if (canShowCommands) {
            commitCommand(matchingCommands[Math.min(activeSuggestion, matchingCommands.length - 1)].id);
            return;
        }
        if (savedChat && isQuickCreateCommand(mess)) {
            commitCommand(mess.trimStart().toLowerCase().startsWith("/act") ? "act" : "plan");
            return;
        }
        if (sending.current || forwardMedia?.targetPath === location.pathname) return;
        const currentPost = forwardPost;
        const currentRoute = location.pathname;
        const currentDraftKey = draftKey;
        const trimmedMess = [mess.trim(), currentPost ? new URL("/post/" + currentPost.id, window.location.origin).href : ""].filter(Boolean).join("\n\n");
        const currentEntity = linkedEntity;
        const hasContent = trimmedMess || files.length > 0 || editing && oldMedia.length > 0 || redirect || currentEntity;
        if (!(nick || id) || !hasContent) return;
        sending.current = true;
        // Сохраняем текущие значения перед очисткой
        const currentFiles = [...files];
        const currentAnswer = answer;
        const currentRedirect = redirect;
        const currentShowNames = showNames;
        try {
            if (editing !== null) {
                const keptUrls = oldMedia.map(m => m.url);
                if ((await editMess(Number(editing.id), trimmedMess, files, keptUrls, answer !== null ? answer.id : undefined)) === true) {
                    setEditing(null);
                    setChosenMess([]);
                }
            } else {
                const tempId = -Date.now();
                const tempMessage: message = {
                    id: tempId,
                    clientId: tempId,
                    animateIn: true,
                    sender_id: user.id ?? "You",
                    sender_name: user.username || user.username || "You",
                    sender_nick: user.nick || "",
                    sender_avatar_url: user.avatar_url || "",
                    content: trimmedMess,
                    entity_type: currentEntity?.type || null,
                    entity_id: currentEntity?.id || null,
                    created_at: new Date(),
                    files: currentFiles.map(
                        f => ({
                            url: URL.createObjectURL(f),
                            name: f.name,
                            type: f.type,
                            message_id: String(tempId)
                        })
                    ),
                    read_by: [],
                    reactions: [],
                    answer_id: currentAnswer ? Number(currentAnswer.id) : null,
                    edited: false,
                    redirected_id: null,
                    is_system: false,
                    is_pinned: false,
                    target_id: null,
                    isPending: true
                };
                setMessages(prev => [...prev, tempMessage]);
                // Очищаем поле сразу
                setMess("");
                setLinkedEntity(null);
                setFiles([]);
                setChosenMess([]);
                setRedirect(undefined);
                setForwardPost(null);
                setShowNames(true);
                if (sendTypingStatus) stopTyping();
                const success = await sendMess(
                    {
                        nick,
                        id
                    },
                    trimmedMess,
                    currentFiles,
                    currentAnswer !== null ? currentAnswer.id : undefined,
                    currentRedirect,
                    currentShowNames,
                    confirmedMessages => {
                        if (routeRef.current !== currentRoute) return;

                        setMessages(prev => {
                            const serverIds = new Set(confirmedMessages.map(message => message.id));
                            const pendingIndex = prev.findIndex(message => message.id === tempId);
                            const confirmed = confirmedMessages.map((message, index) => ({
                                ...(prev.find(existing => existing.id === message.id) ?? message),
                                ...(index === 0 ? { clientId: tempId, animateIn: true } : {})
                            }));

                            if (pendingIndex === -1) {
                                const missing = confirmed.filter(message => !prev.some(existing => existing.id === message.id));
                                return missing.length ? [...prev, ...missing] : prev;
                            }

                            const next = prev.filter(message => message.id !== tempId && !serverIds.has(message.id));
                            const insertIndex = prev.slice(0, pendingIndex).filter(message => !serverIds.has(message.id)).length;
                            next.splice(insertIndex, 0, ...confirmed);
                            return next;
                        });
                    },
                    currentEntity || undefined
                );
                if (!success) {
                    // Если отправка не удалась — убираем временное сообщение
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    const failedDraft: FailedChatDraft = {
                        key: ++nextFailedDraftId,
                        route: currentRoute,
                        receiver: { nick, id },
                        text: trimmedMess,
                        files: currentFiles,
                        answerId: currentAnswer?.id,
                        redirect: currentRedirect,
                        showNames: currentShowNames,
                        linkedEntity: currentEntity || undefined
                    };
                    const next = [...(failedChatDrafts.get(currentDraftKey) ?? []), failedDraft];
                    failedChatDrafts.set(currentDraftKey, next);
                    if (routeRef.current === currentRoute) setFailedDrafts(next);
                }
            }
        } catch (error) {
            console.error("Ошибка при отправке сообщения:", error);
            if (routeRef.current === currentRoute && currentPost) setForwardPost(currentPost);
        } finally {
            sending.current = false;
        }
    };



    useEffect(() => {
        setFiles([]);
    }, [nick]);

    useEffect(
        () => {
            if (location.pathname.startsWith("/chat") && droppedFiles?.length > 0 && (nick || id) && !chatLoading) {
                setFiles(
                    prev => [...prev, ...droppedFiles.filter(f => f instanceof File && typeof f.type === 'string')]
                );
                setDroppedFiles([]);
            }
        },
        [chatLoading, droppedFiles, id, location.pathname, nick, setDroppedFiles]
    );
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedFiles = Array.from(e.clipboardData.files).filter(f => f instanceof File && typeof f.type === 'string');
        if (pastedFiles.length > 0) {
            if (!e.clipboardData.getData("text/plain")) e.preventDefault();
            setFiles(prev => [...prev, ...pastedFiles]);
        }
    };
    const handleRemoveFile = (index: number) => {
        if (index < oldMedia.length) {
            setOldMedia(prev => prev.filter((_, i) => i !== index));
        } else {
            setFiles(prev => prev.filter((_, i) => i !== index - oldMedia.length));
        }
    };
    const barOpen = linkedEntity !== null || forwardPost !== null || forwardMedia?.targetPath === location.pathname || files.length > 0 || answer !== null || editing !== null || redirect !== undefined;

    return (
        <>
            {failedDrafts.length > 0 && <div className="chatFailedDrafts">
                {failedDrafts.map(draft => (
                    <div className="chatFailedDraft" key={draft.key}>
                        <div className="chatFailedDraftContent">
                            <div>{tc("chatUi.failedMessage")}</div>
                            {draft.text && <div className="chatFailedDraftText">{draft.text}</div>}
                            {draft.files.length > 0 && <div className="chatFailedDraftFiles">{draft.files.map(file => file.name).join(", ")}</div>}
                        </div>
                        <div className="chatFailedDraftActions">
                            <button type="button" disabled={retryingFailedId !== null} onClick={() => retryFailedDraft(draft)}>{tc("chatUi.retryMessage")}</button>
                            <button type="button" disabled={retryingFailedId === draft.key} aria-label={tc("chatUi.discardFailedMessage")} onClick={() => removeFailedDraft(draft.key)}><X size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>}
            <div className="chatTAStr" ref={commandRowRef}>
                <div className="chatTaButts">
                    <div className="chatWriteSvgButt" onClick={() => inputFileRef.current?.click()}>
                        <Paperclip className="chatSvg" />
                    </div>
                </div>
                <div className={`chatWriteBar inputWithEmoji ${barOpen ? "open" : ""} ${quickDraft ? "commandMode" : ""}`} ref={emojiButtRef}>
                    {answer !== null && <MessBarBlock object={answer} scrollToMessage={scrollToMessage} />}
                    {editing !== null && <MessBarBlock object={editing} scrollToMessage={scrollToMessage} />}
                    {redirect !== undefined && <MessBarBlock
                        object={redirect?.length === 1 ? {
                            id: String(redirect[0].id),
                            sender: redirect[0].sender_name,
                            previewText: redirect[0].content.length > 0 ? redirect[0].content : redirect[0].files?.length ? `${redirect[0].files?.length} mediafile` : tc("chatUi.forwarded")
                        } : {
                            id: "0",
                            sender: [...new Set(redirect.filter(m => m.sender_name === m.sender_name).map(m => m.sender_name))].join(
                                ',  '
                            ),
                            previewText: tc("chatUi.forwardedCount", { count: redirect.length })
                        }}
                        scrollToMessage={scrollToMessage}
                    />}
                    {forwardPost && <div className="answerDiv postForwardDraft">
                        <div className="answer">
                            <div className="answer1str">{t("post.forward")}: {forwardPost.author}</div>
                            <div className="answer2str">{forwardPost.text || t("post.open")}</div>
                        </div>
                        <button type="button" className="closeAnswer" aria-label={t("editor.close")} onClick={() => setForwardPost(null)}>
                            <X />
                        </button>
                    </div>}
                    {forwardMedia?.targetPath === location.pathname && <div className="answerDiv postForwardDraft">
                        <div className="answer">
                            <div className="answer1str">{tc("chatMenu.forward")}</div>
                            <div className="answer2str">{forwardMedia.name}</div>
                        </div>
                        <button type="button" className="closeAnswer" aria-label={t("editor.close")} onClick={() => setForwardMedia(null)}>
                            <X />
                        </button>
                    </div>}
                    {linkedEntity && <div className="chatSharedEntityDraft">
                        <div className="answer">
                            <div className="answer1str">{tc("chatUi.shareType." + linkedEntity.type)}</div>
                            <div className="answer2str">{linkedEntity.label}</div>
                        </div>
                        <button className="closeAnswer" type="button"
                            aria-label={tc("chatUi.quickCommands.close")}
                            onClick={() => setLinkedEntity(null)}><X/></button>
                    </div>}
                    <MediaDraft files={files} media={oldMedia} onRemove={handleRemoveFile} />
                    {!quickDraft && <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar} />}
                    {savedChat && (quickDraft || !mess.trim() || mess.trimStart().startsWith("/")) && !editing && <button
                        type="button"
                        className={`chatSlashButton ${quickDraft ? "quickActive" : ""}`}
                        aria-label={quickDraft ? tc("chatUi.quickCommands.close") : tc("chatUi.quickCommands.aria")}
                        aria-expanded={Boolean(canShowCommands || quickDraft)}
                        onPointerDown={event => event.preventDefault()}
                        onClick={() => {
                            // iOS keeps the keyboard open when focus is restored in the direct tap handler.
                            if (!quickDraft) textAreaRef.current?.focus({ preventScroll: true });
                            if (quickDraft) {
                                cancelQuickCommand();
                                return;
                            }
                            if (canShowCommands) {
                                setCommandListDismissed(true);
                                setPreviewCommand(null);
                                if (mess.trim() === "/") setMess("");
                                return;
                            }
                            setShowEmojiBar(false);
                            setPreviewCommand(null);
                            setCommandListDismissed(false);
                            setActiveSuggestion(0);
                            setMess("/");
                            requestAnimationFrame(() => textAreaRef.current?.focus({ preventScroll: true }));
                        }}
                    >{quickDraft ? <X size={18}/> : "/"}</button>}
                    {!!shareSuggestions.length && <EntitySuggestionList
                        className="chatShareSuggestions"
                        anchorRef={commandRowRef}
                        popupRef={commandPopupRef}
                        items={shareSuggestions}
                        activeIndex={Math.min(activeShare,shareSuggestions.length-1)}
                        onSelect={chooseShare}
                        onPreview={item => { if (!shareMatch) setSharePreview(item.label + " "); }}
                        onPreviewEnd={() => setSharePreview(null)}
                    />}
                    {!!matchingMentions.length && <EntitySuggestionList
                        className="chatMentionSuggestions"
                        anchorRef={commandRowRef}
                        popupRef={commandPopupRef}
                        items={matchingMentions}
                        activeIndex={Math.min(activeMention, matchingMentions.length - 1)}
                        onSelect={commitMention}
                    />}
                    {canShowCommands && <EntitySuggestionList
                        className="chatCommandSuggestions"
                        anchorRef={commandRowRef}
                        popupRef={commandPopupRef}
                        items={matchingCommands}
                        activeIndex={Math.min(activeSuggestion, matchingCommands.length - 1)}
                        onSelect={item => commitCommand(item.id)}
                        onPreview={item => setPreviewCommand(tc(item.id === "act" ? "chatUi.quickCommands.actTemplate" : "chatUi.quickCommands.planTemplate"))}
                        onPreviewEnd={() => setPreviewCommand(null)}
                    />}
                    {quickDraft ? <QuickCommandComposer
                        draft={quickDraft}
                        onChange={setQuickDraft}
                        onCancel={cancelQuickCommand}
                        onSubmit={() => void submitQuickCommand()}
                        disabled={quickSending || !!createdQuick.current}
                        suggestionPopupRef={commandPopupRef}
                    /> : <div className="chatCommandEditor">
                        <TA
                            name="chatTA"
                            id="chatTA"
                            className="chatTA chatTAwFiles"
                            value={displayedMess}
                            taRef={textAreaRef}
                            onChange={e => {
                                const nextText = e.currentTarget.value;
                                if (savedChat && !editing) {
                                    const command = quickCommandOnSpace(nextText);
                                    if (command) {
                                        commitCommand(command);
                                        return;
                                    }
                                }
                                setPreviewCommand(null);
                                setCommandListDismissed(false);
                                setActiveSuggestion(0);
                                if (savedChat && nextText.trimStart().startsWith("/")) setShowEmojiBar(false);
                                setMess(nextText);
                                setMentionCaret(e.currentTarget.selectionStart);
                                setShareDismissed(false);
                                setSharePreview(null);
                                setActiveShare(0);
                                setMentionDismissed(false);
                                setActiveMention(0);
                                if (!editing && sendTypingStatus) handleTyping(chatWith ? chatWith.id : "");
                            }}
                            onKeyDown={handleKeyDown}
                            onClick={e => {
                                setMentionCaret(e.currentTarget.selectionStart);
                                setMentionDismissed(false);
                            }}
                            onKeyUp={e => setMentionCaret(e.currentTarget.selectionStart)}
                            placeholder={savedChat ? tc("chatUi.savedPlaceholder") : tc("chatUi.placeholder")}
                            onPaste={handlePaste}
                        />
                    </div>}
                </div>
                <div ref={commandSendRef} className={quickSending ? "chatWriteTAButt quickSending" : "chatWriteTAButt"} onClick={handleSend}>
                    <PaperPlaneRightIcon className="chatSend" weight="fill" />
                </div>
            </div>
            <input
                type="file"
                multiple
                style={{
                    display: "none"
                }}
                ref={inputFileRef}
                onChange={e => {
                    if (!e.target.files) return;
                    const selectedFiles = Array.from(e.target.files).filter(f => f instanceof File && typeof f.type === 'string');
                    setFiles(prev => [...prev, ...selectedFiles]);
                    e.target.value = "";
                }}
            />
        </>
    );
}
