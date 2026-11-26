import { goalSnapshotLink } from "../../utils/sharedGoal";
import type { Goal } from "../../../HabitPage/components/Overview/goalTypes";
import useLocalStorage from "../../../../components/hooks/utils/useLocalStorage";
import { QuestionIcon, TargetIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { parseSettingCommand, settingLink, sharedSettings } from "../../../Settings/Arrays/sharedSettings";
import SettingCatalogIcon from "../../../Settings/components/SettingCatalogIcon";
import { useSearchableSettings } from "../../../Settings/Arrays/searchableSettings";
import { settingsSearchNavigation } from "../../../Settings/Arrays/settingsSearchNavigation";
import { settingCommandCatalog, settingCommandSuggestions, resolveSettingCommand, isBackgroundAddCommand } from "../../../Settings/Arrays/settingCommands";
import { useTranslation } from "react-i18next";
import TA from "../../../../components/ts/TA";
import MediaDraft from "../../../../components/ts/MediaDraft";
import { Paperclip, PaperPlaneRightIcon, X, CheckCircleIcon, CalendarPlusIcon, CalendarIcon, ArticleIcon, UserCircleIcon, ChatsCircleIcon, UserPlusIcon, GearSixIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
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
import { parseQuickInput, type QuickInputField } from "../../../../components/ts/utils/quickCreateCommand";
import { api } from "../../../../components/ts/api";
import { resolveTimeZone } from "../../../../components/ts/utils/dateToStr";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { MAX_CUSTOM_BACKGROUNDS, WALLPAPER_SHARE_PATH, wallpaperCommandInput, normalizeWallpaperQuery, shareableWallpapers, resolveWallpaperShare, sharedWallpaperLink } from "../../../../components/ts/utils/backgroundCatalog";
import WallpaperShareThumbnail from "../../../../components/ts/WallpaperShareThumbnail";
import { COMPOSITION_SHARE_PATH, compositionCommandInput, resolveCompositionShare, sharedCompositionLink } from "../../../../components/ts/utils/sharedComposition";
import { CompositionPreview } from "../../../Settings/components/CompositionsSettings";
import { privateAssetUrl } from "../../../../components/ts/utils/privateAssetUrl";
import { fetchWallpaperFile, fitWallpaperForChat } from "../../../../components/ts/utils/fetchWallpaperFile";
import { findMentionToken } from "../../../../components/ts/utils/chatMentions";
import type { LinkedEntity } from "../../../../components/context/SendMessContext";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useGroup } from "../../../../components/hooks/GroupHook";
import { useContacts } from "../../../../components/hooks/ContactsHook";
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
    const { list: mentionContacts } = useContacts();
    const { refetchHabits } = useHabits();
    const { upsertPlan, refreshPlans } = usePlans();
    const { timeZone, bg, bgUrl, bgGallery, settingsLoaded, compositions, showRecentCommands } = useSettings();
    const [recentCommands, setRecentCommands] = useLocalStorage<string[]>("at_recent_commands", []);
    const rememberCommand = (label: string) => setRecentCommands(previous => [label, ...previous.filter(value => value !== label)].slice(0, 3));
    const orderCommands = (items: EntitySuggestionItem[], query: string) => {
        if (!showRecentCommands || query !== "/") return items;
        const recent = recentCommands.flatMap(label => items.filter(item => item.label === label));
        return [...recent.map(item => ({ ...item, suffix: <ClockCounterClockwiseIcon size={16}/> })), ...items.filter(item => !recent.some(value => value.id === item.id))];
    };
    const { t: settingsText } = useTranslation("settings");
    const navigate = useNavigate();
    const { showNotification } = useNote();
    const { t } = useTranslation("acc");
    const { t: tc } = useTranslation("common");
    const sending = useRef(false);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const [mentionCaret, setMentionCaret] = useState(0);
    const [activeMention, setActiveMention] = useState(0);
    const [mentionDismissed, setMentionDismissed] = useState(false);
    const [linkedGoal, setLinkedGoal] = useState<{url:string;label:string} | null>(null);
    const [linkedEntity, setLinkedEntity] = useState<(LinkedEntity & {label:string}) | null>(null);
    const [shareItems, setShareItems] = useState<EntitySuggestionItem[]>([]);
    const [shareLoadedKey, setShareLoadedKey] = useState<string | null>(null);
    const [activeShare, setActiveShare] = useState(0);
    const [sharePreview, setSharePreview] = useState<string | null>(null);
    const [shareDismissed, setShareDismissed] = useState(false);
    const [commandScrollTop, setCommandScrollTop] = useState(0);
    const [externalMentions, setExternalMentions] = useState<EntitySuggestionItem[]>([]);
    const { setBlackout } = useBlackout();
    const { refetchGroup } = useGroup();
    const [previewCommand, setPreviewCommand] = useState<string | null>(null);
    const [commandListDismissed, setCommandListDismissed] = useState(false);
    const searchableSettings = useSearchableSettings();
    const [fieldSuggestionsDismissed, setFieldSuggestionsDismissed] = useState(false);
    const [activeFieldSuggestion, setActiveFieldSuggestion] = useState(0);
    const [quickSending, setQuickSending] = useState(false);
    const quickSubmitting = useRef(false);
    const commandPopupRef = useRef<HTMLDivElement | null>(null);
    const commandRowRef = useRef<HTMLDivElement | null>(null);
    const commandSendRef = useRef<HTMLDivElement | null>(null);
    const createdQuick = useRef<{ kind: "habit" | "plan"; id: number } | null>(null);
    const savedChat = !id && !!nick && !!user.nick &&
        nick.toLowerCase() === user.nick.toLowerCase() && !chatWith?.is_group;
    const quickInput = savedChat && !editing ? parseQuickInput(mess) : null;
    const quickDraft = quickInput?.draft ?? null;
    const settingCatalog = settingCommandCatalog(searchableSettings);
    const localSetting = savedChat && !editing && /^\/set(?=\s|$)/i.test(mess);
    const settingInput = !editing && (/^\/settings /i.test(mess) || (localSetting && /^\/set /i.test(mess)));
    const quickLabels: Record<QuickInputField, string> = {
        name: tc("chatUi.quickCommands.requiredName"), description: tc("chatUi.description"),
        periodicity: tc("habitUi.periodicity"), date: tc("chatUi.quickCommands.requiredDate"),
        weeklyDays: tc("chatUi.quickCommands.days"), cycleActive: tc("habitUi.activeDays"), cycleRest: tc("habitUi.restDays"),
        startTime: tc("chatUi.quickCommands.startShort"), endTime: tc("chatUi.quickCommands.endShort")
    };
    const quickPeriodItems = quickInput?.field === "periodicity" ? (["everyday", "weekly", "cycle", "sometimes"] as const).map(id => ({
        id, label: tc("habitUi.period." + id), description: tc("habitUi.periodHint." + id)
    })).filter(item => [item.id, item.label].some(value => value.toLowerCase().includes((quickInput.slots[2] || "").toLowerCase()))) : [];
    const wallpaperInput = !editing ? wallpaperCommandInput(mess) : null;
    const wallpaperChoice = wallpaperInput !== null ? resolveWallpaperShare(wallpaperInput, bg, bgUrl, bgGallery) : null;
    const wallpaperQuery = normalizeWallpaperQuery(wallpaperInput ?? "");
    const wallpaperChoices: EntitySuggestionItem[] = [];
    if (wallpaperInput !== null && settingsLoaded && !(wallpaperChoice && /\s$/.test(mess))) {
        const addWallpaperChoice = (value: string, label: string, choice: NonNullable<typeof wallpaperChoice>) => {
            if (!value.startsWith(wallpaperQuery)) return;
            wallpaperChoices.push({ id: WALLPAPER_SHARE_PATH + " " + value, label, description: value,
                icon: <WallpaperShareThumbnail id={choice.kind === "stock" ? choice.id : undefined} url={choice.kind === "custom" ? choice.url : undefined}/> });
        };
        const currentChoice = resolveWallpaperShare("current", bg, bgUrl, bgGallery);
        if (currentChoice) addWallpaperChoice("current", settingsText("backgroundLibrary.shareCurrent"), currentChoice);
        bgGallery.forEach((entry, index) => addWallpaperChoice(String(index + 1), settingsText("backgroundLibrary.shareNumber", { count: index + 1 }), { kind: "custom", url: entry.url }));
        const groups = [...new Set(shareableWallpapers.map(item => item.commandGroup))];
        for (const group of groups) {
            const items = shareableWallpapers.filter(item => item.commandGroup === group);
            if (!wallpaperQuery.includes(" ") && !(wallpaperQuery === group && /\s$/.test(mess))) {
                addWallpaperChoice(group, settingsText("backgroundLibrary." + items[0].group), { kind: "stock", id: items[0].id });
            } else if (wallpaperQuery === group || wallpaperQuery.startsWith(group + " ")) {
                for (const item of items) addWallpaperChoice(group + " " + item.commandItem, settingsText(item.labelKey), { kind: "stock", id: item.id });
            }
        }
    }
    const compositionInput = !editing ? compositionCommandInput(mess) : null;
    const compositionChoice = compositionInput !== null ? resolveCompositionShare(compositionInput, compositions.items) : null;
    const compositionChoices: EntitySuggestionItem[] = compositionInput !== null && settingsLoaded && !(compositionChoice && /\s$/.test(mess))
        ? compositions.items.flatMap((item, index) => String(index + 1).startsWith(compositionInput) ? [{
            id: COMPOSITION_SHARE_PATH + " " + (index + 1), label: item.name, description: String(index + 1),
            icon: <span className="compositionContextPreview wallpaperShareThumbnail"><CompositionPreview composition={item}/></span>
        }] : []) : [];
    const fieldItems: EntitySuggestionItem[] = fieldSuggestionsDismissed ? [] : compositionInput !== null ? compositionChoices : wallpaperInput !== null ? wallpaperChoices : settingInput ? settingCommandSuggestions(mess, settingCatalog, settingsText, (section, item) =>
        item ? <SettingCatalogIcon item={item} size={18}/> : <section.icon size={18}/>) : quickPeriodItems;
    const quickCommandItems: EntitySuggestionItem[] = [
        { id: "todo", label: "/todo", description: tc("chatUi.createGoalCommand"), icon: <TargetIcon size={18}/> },
        { id: "help", label: "/help", description: tc("chatUi.commandHelp"), icon: <QuestionIcon size={18}/> },
        { id: "act", label: "/act", description: tc("chatUi.quickCommands.createActivity"), icon: <CheckCircleIcon size={18}/> },
        { id: "do", label: "/do", description: tc("chatUi.quickCommands.createPlan"), icon: <CalendarPlusIcon size={18}/> },
        { id: "set", label: "/set", description: settingsText("sharing.localCommandSuggestion"), icon: <GearSixIcon size={18}/> }
    ];
    const savedShareCommandItems: EntitySuggestionItem[] = [
        {id:"share:goal",label:"/goal",description:tc("chatUi.shareGoal"),icon:<TargetIcon size={18}/>},
        {id:"share:habit",label:"/habit",description:tc("chatUi.shareActivity"),icon:<CheckCircleIcon size={18}/>},
        {id:"share:plan",label:"/plan",description:tc("chatUi.sharePlan"),icon:<CalendarIcon size={18}/>},
        {id:"share:post",label:"/post",description:tc("chatUi.sharePost"),icon:<ArticleIcon size={18}/>},
        {id:"share:user",label:"/user",description:tc("chatUi.shareUser"),icon:<UserCircleIcon size={18}/>},
        {id:"settings",label:"/settings",description:settingsText("sharing.commandSuggestion"),icon:<GearSixIcon size={18}/> }
    ];
    const commandQuery = mess.trim();
    const matchingCommands = /^\/[a-z]*$/i.test(commandQuery)
        ? orderCommands([...quickCommandItems, ...savedShareCommandItems].filter(item =>
            item.label.startsWith(commandQuery.toLowerCase()) && !/\s$/.test(mess)), commandQuery) : [];
    const shareCommands: EntitySuggestionItem[] = [
        {id:"goal",label:"/goal",description:tc("chatUi.shareGoal"),icon:<TargetIcon size={18}/>},
        { id: "help", label: "/help", description: tc("chatUi.commandHelp"), icon: <QuestionIcon size={18}/> },
        {id:"habit",label:"/habit",description:tc("chatUi.shareActivity"),icon:<CheckCircleIcon size={18}/>},
        {id:"plan",label:"/plan",description:tc("chatUi.sharePlan"),icon:<CalendarIcon size={18}/>},
        {id:"post",label:"/post",description:tc("chatUi.sharePost"),icon:<ArticleIcon size={18}/>},
        {id:"user",label:"/user",description:tc("chatUi.shareUser"),icon:<UserCircleIcon size={18}/>},
        {id:"group",label:"/group",description:tc("chatUi.shareGroup"),icon:<ChatsCircleIcon size={18}/> },
        {id:"invite",label:"/invite",description:tc(chatWith?.is_group ? "chatUi.inviteLinkToChat" : "chatUi.shareInvite"),icon:<UserPlusIcon size={18}/> },
        {id:"settings",label:"/settings",description:settingsText("sharing.commandSuggestion"),icon:<GearSixIcon size={18}/> }
    ];
    const plainShare = !savedChat && !editing && !shareDismissed && /^\/[a-z]*$/i.test(mess)
        ? orderCommands(shareCommands.filter(item => item.label.startsWith(mess.toLowerCase())), mess) : [];
    const shareMatch = !editing && !shareDismissed &&
        (!savedChat || /^\/(?:plan|habit|post|user|goal)(?=\s|$)/i.test(mess))
        ? /^\/(habit|plan|post|user|group|invite|goal)(?:\s+(.{0,100}))?$/iu.exec(mess) : null;
    const shareRequestKey = shareMatch ? JSON.stringify([nick, id, user.id, chatWith?.id, chatWith?.is_group, shareMatch[1], mess]) : null;
    const shareLoading = shareRequestKey !== null && shareLoadedKey !== shareRequestKey;
    const shareSuggestions = shareLoading ? [] : shareMatch ? shareItems : plainShare;
    const shareListOpen = shareLoading || shareSuggestions.length > 0;
    const canShowCommands = savedChat && !quickDraft && !editing && !shareMatch &&
        !commandListDismissed && matchingCommands.length > 0;
    const chooseShare = (item: EntitySuggestionItem) => {
        if (!shareMatch) rememberCommand(item.label);
        if (!shareMatch && item.id === "help") { setMess(""); setBlackout({ seted: true, module: "CommandHelp", options: { text: "chat" } }); return; }
        if (!shareMatch && item.id === "settings") {
            setFieldSuggestionsDismissed(false);
            setActiveFieldSuggestion(0);
            setMess("/settings ");
            setShareDismissed(true);
            setSharePreview(null);
            setActiveShare(0);
            requestAnimationFrame(() => textAreaRef.current?.focus({ preventScroll: true }));
            return;
        }
        if (!shareMatch) {
            setMess(item.label);
            setShareItems([]);
            setSharePreview(null);
            setActiveShare(0);
            requestAnimationFrame(() => textAreaRef.current?.focus({preventScroll:true}));
            return;
        }
        if (shareMatch[1] === "goal") {
            if (sending.current) return;
            const currentRoute = location.pathname;
            sending.current = true; setQuickSending(true);
            void api.get<{success:boolean;goal:Goal}>("goal-workspace/" + encodeURIComponent(item.id.slice(5))).then(({data}) => {
                if (routeRef.current !== currentRoute) return;
                const url = data.success && data.goal ? goalSnapshotLink(data.goal, window.location.origin) : null;
                if (!url) throw new Error("Goal unavailable");
                setLinkedEntity(null); setLinkedGoal({url,label:data.goal.name}); setMess(""); setShareDismissed(true); setShareItems([]); rememberCommand("/goal");
            }).catch(() => showNotification("error", tc("chatUi.sharedEntityUnavailable"))).finally(() => { sending.current=false; setQuickSending(false); });
            return;
        }
        const separator = item.id.indexOf(":");
        const kind = item.id.slice(0, separator) as LinkedEntity["type"];
        const entityId = item.id.slice(separator + 1);
        if (shareMatch[1] === "invite" && chatWith?.is_group) {
            if (kind !== "habit" && kind !== "plan") return;
            if (!id || String(chatWith.id) !== id || chatLoading) return;
            const chatId = Number(chatWith.id);
            if (!Number.isSafeInteger(chatId) || chatId <= 0) return;
            const groupName = chatWith.name || tc("chatUi.shareType.group");
            setBlackout({
                seted: true,
                module: "ConfirmAction",
                confirmAction: {
                    title: tc("chatUi.addToChat"),
                    description: tc(kind === "plan" ? "chatUi.addPlanToChatDescription" :
                        "chatUi.addHabitToChatDescription", { name: item.label, chat: groupName }),
                    label: tc("chatUi.addToChat"),
                    variant: "approve",
                    run: async () => {
                        const endpoint = kind === "habit"
                            ? "habits/" + entityId + "/chat"
                            : "plans/" + entityId + "/chat";
                        const response = await api.patch(endpoint, {
                            chat_id: chatId,
                            only_if_unlinked: true
                        });
                        if (!response.data?.success) throw new Error("Could not link to chat");
                        await Promise.allSettled([
                            refetchGroup(String(chatId)),
                            kind === "plan" ? refreshPlans() : refetchHabits()
                        ]);
                        showNotification("success", tc("chatUi.addedToChat"));
                    }
                }
            });
            setMess("");
        } else if (shareMatch[1] === "invite" || shareMatch[1] === "group") {
            if (!chatWith || chatWith.is_group || !chatWith.nick || chatWith.id === user.id) {
                showNotification("info", tc("chatUi.inviteFromPrivateChat"));
                return;
            }
            const target = chatWith;
            const selected = { kind, entityId, label: item.label };
            setBlackout({
                seted: true,
                module: "ConfirmAction",
                confirmAction: {
                    title: tc("chatUi.sendInvite"),
                    description: tc("chatUi.inviteRecipient", { name: item.label, nick: target.nick }),
                    label: tc("chatUi.sendInvite"),
                    variant: "approve",
                    run: async () => {
                        if (selected.kind === "group") {
                            const formData = new FormData();
                            formData.append("group_id", selected.entityId);
                            formData.append("members", JSON.stringify([target.id]));
                            const response = await api.post("group/addusers", formData);
                            if (!response.data?.success) throw new Error("Group invite failed");
                        } else {
                            const endpoint = selected.kind === "habit"
                                ? "habits/" + selected.entityId + "/members"
                                : "plans/" + selected.entityId + "/invite";
                            const response = await api.post(endpoint, { nick: target.nick });
                            if (!response.data?.success) throw new Error("Invitation failed");
                        }
                        showNotification("success", tc("chatUi.inviteSent"));
                    }
                }
            });
            setMess("");
        } else {
            setLinkedGoal(null);
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
        setShareLoadedKey(null);
        setActiveShare(0);
        if (!shareMatch || !shareRequestKey) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            const q = shareMatch[2]?.trim() || "";
            if (shareMatch[1] === "goal") {
                void api.get<{success:boolean;goals:Goal[]}>("goal-workspace", {signal:controller.signal}).then(({data}) => {
                    if (controller.signal.aborted) return;
                    setShareItems((data.goals || []).filter(goal => goal.name.toLowerCase().includes(q.toLowerCase())).slice(0,50).map(goal => ({ id:"goal:"+goal.id,label:goal.name,description:Math.round(Number(goal.progress) || 0)+"%",icon:<TargetIcon size={20}/> })));
                }).catch(() => {if(!controller.signal.aborted)setShareItems([]);}).finally(() => {if(!controller.signal.aborted)setShareLoadedKey(shareRequestKey);});
                return;
            }
            const kinds = shareMatch[1] === "invite" ? ["habit","plan"] : [shareMatch[1]];
            void Promise.all(kinds.map(kind => api.get("search/global",{
                params: {
                    q: "/" + kind + (q ? " " + q : ""),
                    page: 0,
                    ...(shareMatch[1] === "invite" && chatWith?.is_group ? { link_to_chat: "1" } : {})
                },
                signal: controller.signal
            }))).then(results => {
                if (controller.signal.aborted) return;
                setShareItems(results.flatMap(response => response.data?.items || [])
                    .filter((entry:{kind:string;id:string;label:string}) => entry.id && entry.label)
                    .map((entry:{kind:string;id:string;label:string}) => ({
                        id: entry.kind + ":" + entry.id, label: entry.label,
                        description: tc("sideMenu.searchFilter." + entry.kind)
                    })));
                setActiveShare(0);
            }).catch(() => { if (!controller.signal.aborted) setShareItems([]); })
                .finally(() => { if (!controller.signal.aborted) setShareLoadedKey(shareRequestKey); });
        },250);
        return () => {window.clearTimeout(timer);controller.abort();};
    }, [shareRequestKey]);
    const mentionToken = !savedChat && !quickDraft && !settingInput && !editing && !mentionDismissed
        ? findMentionToken(mess, mentionCaret) : null;
    const mentionMembers = chatWith?.is_group ? chatWith.members || [] : chatWith
        ? [{ id: chatWith.id, nick: chatWith.nick, avatar_url: chatWith.avatar_url || "" }] : [];
    useEffect(() => {
        setExternalMentions([]);
        if (!mentionToken) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void api.get("search/global", {
                params: { q: "/user " + mentionToken.query, page: 0 }, signal: controller.signal
            }).then(response => {
                if (controller.signal.aborted) return;
                const memberIds = new Set(mentionMembers.map(member => member.id));
                setExternalMentions((response.data?.items || [])
                    .filter((entry: {id:string}) => !memberIds.has(entry.id) && entry.id !== user.id)
                    .map((entry: {id:string;label:string;description:string}) => ({
                        id:"card:" + entry.id,
                        label:entry.description || entry.label,
                        description:entry.label + " · " + tc("chatUi.shareUser")
                    })).slice(0, 10));
            }).catch(() => { if (!controller.signal.aborted) setExternalMentions([]); });
        }, 250);
        return () => {window.clearTimeout(timer);controller.abort();};
    }, [mentionToken?.query, chatWith?.id, user.id]);
    const contactMentions: EntitySuggestionItem[] = mentionToken ? mentionContacts
        .filter(contact => !contact.is_group && contact.nick && contact.id !== user.id &&
            !mentionMembers.some(member => member.id === contact.id) &&
            contact.nick.toLocaleLowerCase().startsWith(mentionToken.query.toLocaleLowerCase()))
        .slice(0, 10).map(contact => ({
            id: "card:" + contact.id,
            label: contact.name || contact.nick,
            description: "@" + contact.nick + " · " + tc("chatUi.shareUser")
        })) : [];
    const matchingMentions: EntitySuggestionItem[] = mentionToken
        ? [...mentionMembers.filter(member => member.nick && member.id !== user.id &&
            member.nick.toLocaleLowerCase().startsWith(mentionToken.query.toLocaleLowerCase()))
            .slice(0, 15).map(member => ({
                id: member.nick,
                label: "@" + member.nick,
                description: tc("chatUi.mentionUser")
            })), ...contactMentions, ...externalMentions.filter(member =>
                !contactMentions.some(contact => contact.id === member.id))] : [];
    const commitMention = (member: EntitySuggestionItem) => {
        if (!mentionToken) return;
        const outside = member.id.startsWith("card:");
        const inserted = outside ? "" : "@" + member.id + " ";
        const next = mess.slice(0, mentionToken.start) + inserted + mess.slice(mentionToken.end);
        if (outside) setLinkedEntity({
            type: "user", id: member.id.slice(5), label: member.description || member.label
        });
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
    const commandHighlight = !editing &&
        (savedChat || !/^\/(?:act|do|set)(?=\s|$)/i.test(displayedMess))
        ? displayedMess.match(/^\/(?:act|do|habit|plan|post|user|invite|group|set|settings)(?=\s|$)/i)?.[0] : null;
    const commitCommand = (id: string) => {
        createdQuick.current = null;
        setMess("/" + id + " ");
        setPreviewCommand(null);
        setCommandListDismissed(true);
        setFieldSuggestionsDismissed(false);
        setShowEmojiBar(false);
        requestAnimationFrame(() => textAreaRef.current?.focus({ preventScroll: true }));
    };
    const chooseField = (item: EntitySuggestionItem) => {
        if (settingInput) setMess((localSetting ? "/set " : "/settings ") + item.id + " ");
        else if (quickInput?.field === "periodicity") {
            const prefix = mess.match(/^\/(?:act|do) (?:[^" ]|"[^"]*")* (?:[^" ]|"[^"]*")* /i)?.[0] ?? mess.slice(0, mess.length - (quickInput.slots[2] || "").length);
            setMess(prefix + item.id + " ");
        }
        setFieldSuggestionsDismissed(false);
        setActiveFieldSuggestion(0);
        requestAnimationFrame(() => {
            textAreaRef.current?.focus({ preventScroll: true });
            const ta = textAreaRef.current;
            if (ta) ta.setSelectionRange(ta.value.length, ta.value.length);
        });
    };
    const selectSavedCommand = (item: EntitySuggestionItem) => {
        rememberCommand(item.label);
        if (item.id === "help" || item.id === "todo") {
            setMess("");
            setBlackout({ seted: true, module: item.id === "help" ? "CommandHelp" : "AddGoal", options: { text: item.id === "help" ? "saved" : "" } });
            return;
        }
        if (item.id === "settings" || item.id === "set") {
            setFieldSuggestionsDismissed(false);
            setActiveFieldSuggestion(0);
            setMess(item.label + " ");
            setCommandListDismissed(true);
            setPreviewCommand(null);
            setSharePreview(null);
            requestAnimationFrame(() => textAreaRef.current?.focus({ preventScroll: true }));
            return;
        }
        if (!item.id.startsWith("share:")) {
            commitCommand(item.id);
            return;
        }
        setShareDismissed(false);
        setCommandListDismissed(true);
        setPreviewCommand(null);
        setSharePreview(null);
        setActiveShare(0);
        setShareItems([]);
        setMess(item.label);
        requestAnimationFrame(() => textAreaRef.current?.focus({ preventScroll: true }));
    };
    const cancelQuickCommand = () => {
        if (quickSending) return;
        createdQuick.current = null;
        setMess("");
        setPreviewCommand(null);
        setCommandListDismissed(false);
        requestAnimationFrame(() => textAreaRef.current?.focus({ preventScroll: true }));
    };
    const submitQuickCommand = async () => {
        if (!quickDraft || quickSubmitting.current || sending.current || !savedChat || !nick ||
            files.length || oldMedia.length || editing || redirect || forwardPost || forwardMedia) return;
        if (quickInput?.quoted || (quickInput && quickInput.slots.slice(quickInput.fields.length).some(Boolean))) {
            showNotification("error", tc("chatUi.quickCommands.invalidInput"));
            return;
        }
        const name = quickDraft.name?.trim() || "";
        if (!name || name.length > (quickDraft.kind === "habit" ? 40 : 160)) {
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
        if (!canShowCommands && !quickDraft && !shareListOpen && !settingInput) return;
        const dismiss = (event: PointerEvent) => {
            const target = event.target as Node;
            if (commandPopupRef.current?.contains(target) || commandSendRef.current?.contains(target)) return;
            if (quickDraft || settingInput) {
                if (emojiButtRef.current?.contains(target)) return;
                setFieldSuggestionsDismissed(true);
            } else if (shareListOpen) {
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
    }, [canShowCommands, quickDraft, quickSending, mess, emojiButtRef, setMess, shareListOpen, settingInput]);
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
        setPreviewCommand(null);
        setCommandListDismissed(false);
        setFieldSuggestionsDismissed(false);
        setActiveFieldSuggestion(0);
        setActiveSuggestion(0);
        setMentionCaret(0);
        setMentionDismissed(false);
        setActiveMention(0);
        setLinkedEntity(null); setLinkedGoal(null);
        setShareItems([]);
        setShareDismissed(false);
        setCommandScrollTop(0);
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
    const backgroundFileRef = useRef<HTMLInputElement>(null);
    const openBackgroundAdd = (file: File) => {
        if (bgGallery.length >= MAX_CUSTOM_BACKGROUNDS) {
            showNotification("info", settingsText("backgroundLibrary.limit"));
            return;
        }
        if (file.size > 25 * 1024 * 1024 || !/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) {
            showNotification("error", settingsText("backgroundLibrary.uploadInvalid"));
            return;
        }
        const currentRoute = location.pathname;
        setBlackout({ seted: true, module: "BgHandler", bg: file, onBgSaved: () => {
            if (routeRef.current !== currentRoute) return;
            setMess(previous => isBackgroundAddCommand(previous) ? "" : previous);
            setFiles(previous => previous.filter(item => item !== file));
            setFieldSuggestionsDismissed(false);
        } });
    };

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
        if (shareLoading && !e.nativeEvent.isComposing) {
            if (e.key === "Escape") {
                e.preventDefault();
                setShareDismissed(true);
                setSharePreview(null);
                return;
            }
            if (e.key === "ArrowUp" || e.key === "ArrowDown" ||
                (e.key === "Enter" && !e.shiftKey) || (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                e.preventDefault();
                return;
            }
        }
        if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.nativeEvent.isComposing) {
            if (fieldItems.length) {
                e.preventDefault();
                chooseField(fieldItems[Math.min(activeFieldSuggestion, fieldItems.length - 1)]);
                return;
            }
            if (shareSuggestions.length) {
                e.preventDefault();
                chooseShare(shareSuggestions[Math.min(activeShare, shareSuggestions.length - 1)]);
                return;
            }
            if (matchingMentions.length) {
                e.preventDefault();
                commitMention(matchingMentions[Math.min(activeMention, matchingMentions.length - 1)]);
                return;
            }
            if (canShowCommands) {
                e.preventDefault();
                selectSavedCommand(matchingCommands[Math.min(activeSuggestion, matchingCommands.length - 1)]);
                return;
            }
        }
        if (!e.nativeEvent.isComposing && (quickDraft || settingInput)) {
            if (e.key === "Escape") { e.preventDefault(); setFieldSuggestionsDismissed(true); return; }
            if (fieldItems.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                e.preventDefault();
                setActiveFieldSuggestion(i => (i + (e.key === "ArrowDown" ? 1 : -1) + fieldItems.length) % fieldItems.length);
                return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (fieldItems.length) chooseField(fieldItems[Math.min(activeFieldSuggestion, fieldItems.length - 1)]);
                else if (quickDraft && quickInput?.field && quickInput.field !== "endTime" && !quickInput.quoted && e.currentTarget.selectionStart === mess.length) {
                    setMess(mess + " ");
                    setFieldSuggestionsDismissed(false);
                } else void handleSend();
                return;
            }
        }
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
                selectSavedCommand(matchingCommands[Math.min(activeSuggestion, matchingCommands.length - 1)]);
                return;
            }
        }
        if (shareMatch && e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            showNotification("info", tc("chatUi.shareSearchHint"));
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
        if (!editing && /^\/help\s*$/i.test(mess)) { rememberCommand("/help"); setMess(""); setBlackout({ seted: true, module: "CommandHelp", options: { text: savedChat ? "saved" : "chat" } }); return; }
        const todo = savedChat && !editing ? /^\/todo(?:\s+(.+))?\s*$/i.exec(mess) : null;
        if (todo) { rememberCommand("/todo"); setMess(""); setBlackout({ seted: true, module: "AddGoal", options: { name: todo[1]?.trim() } }); return; }
        if (shareLoading) return;
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
            selectSavedCommand(matchingCommands[Math.min(activeSuggestion, matchingCommands.length - 1)]);
            return;
        }
        if (sending.current || forwardMedia?.targetPath === location.pathname) return;
        // Local wallpaper action must run before the normal attachment/message pipeline.
        if (localSetting && isBackgroundAddCommand(mess)) {
            if (bgGallery.length >= MAX_CUSTOM_BACKGROUNDS) {
                showNotification("info", settingsText("backgroundLibrary.limit"));
                return;
            }
            if (files.length > 1 || linkedEntity || redirect || forwardPost || forwardMedia || answer) {
                showNotification("info", settingsText("sharing.backgroundAddSingle"));
                return;
            }
            if (files.length === 1) openBackgroundAdd(files[0]);
            else backgroundFileRef.current?.click();
            return;
        }
        const settingTarget = settingInput ? resolveSettingCommand(mess, settingCatalog) : null;
        const command = !editing && wallpaperInput === null && compositionInput === null ? parseSettingCommand(settingTarget?.presetText ?? mess) : null;
        let presetUrl: string | undefined;
        let wallpaperFile: File | undefined;
        if (compositionInput !== null) {
            if (!settingsLoaded || !compositionChoice) {
                showNotification("error", settingsText("personalization.compositions.shareNotFound"));
                return;
            }
            if (files.length || linkedEntity || redirect || forwardPost || forwardMedia || answer) {
                showNotification("info", settingsText("sharing.commandHelp"));
                return;
            }
            const url = sharedCompositionLink(compositionChoice, window.location.origin);
            if (!url) {
                showNotification("error", settingsText("personalization.compositions.shareNotFound"));
                return;
            }
            if (compositionChoice.appearance.bg === "custom") {
                const source = privateAssetUrl(compositionChoice.appearance.bgUrl);
                if (!source || !bgGallery.some(item => privateAssetUrl(item.url) === source)) {
                    showNotification("error", settingsText("backgroundLibrary.shareNotFound"));
                    return;
                }
                const sourceRoute = location.pathname;
                sending.current = true;
                setQuickSending(true);
                try { wallpaperFile = await fitWallpaperForChat(await fetchWallpaperFile(source, "bgs")); }
                catch { showNotification("error", settingsText("backgroundLibrary.shareNotFound")); return; }
                finally { sending.current = false; setQuickSending(false); }
                if (routeRef.current !== sourceRoute) return;
            }
            presetUrl = url;
        }
        if (wallpaperInput !== null) {
            if (!settingsLoaded || !wallpaperChoice) {
                showNotification("error", settingsText("backgroundLibrary.shareNotFound"));
                return;
            }
            if (files.length || linkedEntity || redirect || forwardPost || forwardMedia || answer) {
                showNotification("info", settingsText("backgroundLibrary.shareInvalid"));
                return;
            }
            const sourceRoute = location.pathname;
            if (wallpaperChoice.kind === "custom") {
                if (!bgGallery.some(item => privateAssetUrl(item.url) === privateAssetUrl(wallpaperChoice.url))) {
                    showNotification("error", settingsText("backgroundLibrary.shareNotFound"));
                    return;
                }
                sending.current = true;
                setQuickSending(true);
                try {
                    const original = await fetchWallpaperFile(wallpaperChoice.url, "bgs").catch(() => null);
                    if (!original) { showNotification("error", settingsText("backgroundLibrary.shareNotFound")); return; }
                    wallpaperFile = await fitWallpaperForChat(original);
                } catch {
                    showNotification("error", settingsText("backgroundLibrary.shareSendError"));
                    return;
                } finally { sending.current = false; setQuickSending(false); }
                if (routeRef.current !== sourceRoute) return;
            }
            presetUrl = sharedWallpaperLink(wallpaperChoice, window.location.origin);
        }
        if (command) {
            if (/^\/set(?=\s|$)/i.test(mess) && !localSetting) {
                showNotification("info", settingsText("sharing.localOnly"));
                return;
            }
            if (files.length || linkedEntity || redirect || forwardPost || forwardMedia || answer) {
                showNotification("info", settingsText("sharing.commandHelp"));
                return;
            }
            if (command.setting && command.value !== null) {
                presetUrl = settingLink(command.setting, command.value);
                if (localSetting) {
                    setMess("");
                    setBlackout({ seted: true, module: "SharedSettingPreview", options: { url: presetUrl } });
                    return;
                }
            } else {
                const entry = settingTarget?.entry;
                const definition = command.setting && command.input === command.setting ? sharedSettings[command.setting] : null;
                let target: { pathname: string; state?: { settingId?: string; settingName?: string; from?: string } } | undefined;
                if (entry && !entry.action && (!settingTarget?.presetText || definition)) {
                    target = entry.item ? settingsSearchNavigation(entry.section.id, entry.item) :
                        definition ? { pathname: "/settings/" + definition.section, state: { settingId: definition.id } } :
                        { pathname: "/settings/" + entry.section.id };
                } else if (definition) target = { pathname: "/settings/" + definition.section, state: { settingId: definition.id } };
                else if (command.input === "" || command.input === "background")
                    target = { pathname: command.input === "background" ? "/wallpapers" : "/settings" };
                if (!target) {
                    showNotification("info", settingsText("sharing.commandHelp"));
                    return;
                }
                if (localSetting) {
                    setMess("");
                    navigate(target.pathname, { state: target.state });
                    return;
                }
                const url = new URL(target.pathname, window.location.origin);
                if (target.state?.settingId && target.pathname.startsWith("/settings/") && target.pathname !== "/settings/language")
                    url.searchParams.set("setting", target.state.settingId);
                presetUrl = url.href;
            }
        }
        const currentPost = forwardPost;
        const currentRoute = location.pathname;
        const currentDraftKey = draftKey;
        const trimmedMess = [presetUrl ?? mess.trim(), linkedGoal?.url || "", currentPost ? new URL("/post/" + currentPost.id, window.location.origin).href : ""].filter(Boolean).join("\n\n");
        const currentEntity = linkedEntity;
        const hasContent = trimmedMess || files.length > 0 || editing && oldMedia.length > 0 || redirect || currentEntity;
        if (!(nick || id) || !hasContent) return;
        sending.current = true;
        // Сохраняем текущие значения перед очисткой
        const currentFiles = wallpaperFile ? [wallpaperFile] : [...files];
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
                setLinkedEntity(null); setLinkedGoal(null);
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
    const barOpen = linkedGoal !== null || linkedEntity !== null || forwardPost !== null || forwardMedia?.targetPath === location.pathname || files.length > 0 || answer !== null || editing !== null || redirect !== undefined;

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
                    {linkedGoal && <div className="chatSharedEntityDraft"><div className="answer"><div className="answer1str">{tc("chatUi.shareGoal")}</div><div className="answer2str">{linkedGoal.label}</div></div><button type="button" className="closeAnswer" aria-label={tc("chatUi.quickCommands.close")} onClick={() => setLinkedGoal(null)}><X/></button></div>}
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
                    {shareListOpen && <EntitySuggestionList
                        className={`chatShareSuggestions ${!shareMatch ? "chatSlashSuggestions" : ""}`}
                        anchorRef={commandRowRef}
                        popupRef={commandPopupRef}
                        items={shareSuggestions}
                        loading={shareLoading}
                        loadingLabel={tc("sideMenu.globalSearchLoading")}
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
                        onSelect={selectSavedCommand}
                        onPreview={item => setPreviewCommand((item.id.startsWith("share:") || item.id === "settings" || item.id === "set")
                            ? item.label : item.label + " ")}
                        onPreviewEnd={() => setPreviewCommand(null)}
                    />}
                    {!!fieldItems.length && <EntitySuggestionList
                        className="chatFieldSuggestions"
                        anchorRef={commandRowRef}
                        popupRef={commandPopupRef}
                        items={fieldItems}
                        activeIndex={Math.min(activeFieldSuggestion, fieldItems.length - 1)}
                        onSelect={chooseField}
                    />}
                    <div className={`chatCommandEditor ${quickInput || settingInput ? "structuredCommand" : ""}`}>
                        {commandHighlight && <span className="chatCommandHighlight"
                            aria-hidden="true" style={{ transform: `translateY(-${commandScrollTop}px)` }}>
                            {commandHighlight}
                        </span>}
                        {(quickInput || settingInput) && <div className="chatCommandFieldMirror" aria-hidden="true" style={{ transform: `translateY(-${commandScrollTop}px)` }}>
                            <span>{commandHighlight}</span>{displayedMess.slice(commandHighlight?.length ?? 0).split(/("[^"]*"?|\s+)/).map((part, index) => part && <span key={index} className={part.trim() ? "commandArgument" : ""}>{part}</span>)}
                            {/\s$/.test(displayedMess) && !quickInput?.quoted && (quickInput?.field || settingInput) && <span className="commandPlaceholder">{quickInput?.field ? quickLabels[quickInput.field] : settingsText(localSetting ? "sharing.localCommandSuggestion" : "sharing.commandSuggestion")}</span>}
                        </div>}
                        <TA
                            name="chatTA"
                            id="chatTA"
                            className="chatTA chatTAwFiles"
                            minHeight={0}
                            value={displayedMess}
                            readOnly={quickSending || !!(quickDraft && createdQuick.current)}
                            taRef={textAreaRef}
                            onChange={e => {
                                const nextText = e.currentTarget.value;
                                setFieldSuggestionsDismissed(false);
                                setActiveFieldSuggestion(0);
                                if (!parseQuickInput(nextText)) createdQuick.current = null;
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
                            onScroll={e => setCommandScrollTop(e.currentTarget.scrollTop)}
                            onClick={e => {
                                setMentionCaret(e.currentTarget.selectionStart);
                                setMentionDismissed(false);
                                setFieldSuggestionsDismissed(false);
                            }}
                            onKeyUp={e => setMentionCaret(e.currentTarget.selectionStart)}
                            placeholder={savedChat ? tc("chatUi.savedPlaceholder") : tc("chatUi.placeholder")}
                            onPaste={handlePaste}
                        />
                    </div>
                </div>
                <div ref={commandSendRef} className={quickSending ? "chatWriteTAButt quickSending" : "chatWriteTAButt"} onClick={handleSend}>
                    <PaperPlaneRightIcon className="chatSend" weight="fill" />
                </div>
            </div>
            <input type="file" hidden ref={backgroundFileRef}
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={event => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file && localSetting && isBackgroundAddCommand(mess)) openBackgroundAdd(file);
                }}/>
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
