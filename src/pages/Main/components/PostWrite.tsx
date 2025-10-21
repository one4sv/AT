import { useEffect, useMemo, useRef, useState } from "react"
import "../scss/PostWrite.scss"
import SelectList from "../../../components/ts/SelectList"
import { useHabits } from "../../../components/hooks/HabitsHook"
import { Paperclip, SmileySticker, X } from "@phosphor-icons/react"
import { SendHorizontal } from "lucide-react"
import { useNote } from "../../../components/hooks/NoteHook"
import { Emojies, EmojiesGroups } from "../../Chat/utils/emojies"
import GetIconByType from "../../Chat/utils/getIconByType"
import { api } from "../../../components/ts/api"

export default function PostWrite() {
    const { habits } = useHabits()
    const { showNotification } = useNote()

    const [ text, setText ] = useState("")
    const [ showPWbar, setShowPWbar ] = useState(false)
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false)
    const [ files, setFiles ] = useState<File[]>([]) 
    const [ fs, setFS ] = useState<boolean>(false) 
    const [ habit, setHabit ] = useState<string | number | undefined>()

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
    const postWriteRef = useRef<HTMLDivElement | null>(null)
    const inputFileRef = useRef<HTMLInputElement>(null)
    const emojiBarRef = useRef<HTMLDivElement | null>(null)

    const habitsArr = useMemo(() => {
        const arr = [{ label: "без привычки", value: "none" }];
        if (habits) habits.forEach(h => arr.push({ label: h.name, value: String(h.id) }));
        return arr;
    }, [habits]);

    useEffect(() => {
        const ta = textAreaRef.current;
        if (!ta) return;

        if (fs) {
            ta.style.flex = "1";
            ta.style.overflowY = "auto";
            return;
        }

        // иначе — авторасширение
        ta.style.height = "auto";
        ta.style.minHeight = "10vh";

        const newHeight = ta.scrollHeight;
        ta.style.height = newHeight + "px";

        if (newHeight > window.innerHeight * 0.5) {
            ta.style.overflowY = "auto";
        } else {
            ta.style.overflowY = "hidden";
        }
    }, [text, fs]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                !fs &&
                postWriteRef.current &&
                !postWriteRef.current.contains(e.target as Node) &&
                showPWbar
            ) {
                setShowPWbar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [fs, showPWbar]);
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
            emojiBarRef.current &&
            !emojiBarRef.current.contains(e.target as Node) &&
            showEmojiBar
            ) {
            setShowEmojiBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiBar]);

    const handleAddEmoji = (emoji:string) => {
        const ta = textAreaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;

        setText(prev => {
            const newValue = prev.slice(0, start) + emoji + prev.slice(end);
            requestAnimationFrame(() => {
                ta.focus();
                ta.selectionStart = ta.selectionEnd = start + emoji.length;
            });
            return newValue;
        });
    }

    const handleSend = async () => {
        if (text.trim().length > 0 || files.length > 0) {
            try {
                const formData = new FormData();
                formData.append("text", text.trim());
                if (habit && habit !== "none") {
                    formData.append("habit_id", String(habit));
                }
                files.forEach(f => formData.append("media", f));

                const res = await api.post("/addpost", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                if (res.data.success) {
                    showNotification("success", "Опубликовано");
                    setText("");
                    setFiles([]);
                    setShowPWbar(false);
                    setHabit("none");
                }
            } catch (err) {
                console.error(err);
                showNotification("error", "Ошибка публикации");
                setFS(false)
            }
        } else {
            return
        }
        
    };

    return (
        <div className={`postWriteWrapper ${fs ? "PWTAWFS" : ""}`} ref={postWriteRef} >
            {showEmojiBar && (
                <div className="emojiBar pwEmojiBar" ref={emojiBarRef}>
                    {EmojiesGroups.map((g, i) => (
                        <div className="emojiGroup" key={i}>
                            <div className="emojiGroupName">{g.value}</div>
                            <div className="emojiList">
                                {Emojies.filter(e => e.group === g.group).map((e, j) => (
                                    <div
                                        className="emoji"
                                        key={j}
                                        onClick={() => handleAddEmoji(e.pic)}
                                    >
                                        {e.pic}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showPWbar && (
                <div className={`postWriteBar ${files.length > 0 ? "pwBarwFiles" : ""}`}>
                    {/* <div className="postWriteSvgButt pwFSButt" onClick={() => setFS(!fs)}>
                        {fs ? <CornersIn /> : <CornersOut/>}
                    </div> */}
                    <SelectList arr={habitsArr} className="postWriteSL" selected={"none"} prop={setHabit}/>
                    {!fs && (
                        <>
                        <div className="postWriteSvgButt" onClick={() => inputFileRef.current?.click()}>
                            <Paperclip className="pwSvg"/>
                        </div>                    
                        <div className="postWriteSvgButt" onClick={() => setShowEmojiBar(!showEmojiBar)}>
                            <SmileySticker className="pwSvg"/>
                        </div>
                        </>
                    )}
                    <div className="postWriteTAButt" onClick={handleSend}>
                        <SendHorizontal className="chatSend" fill="currenColor"/>
                    </div>
                </div>
            )}
            {files.length > 0 && !fs && (
                <div className={`chatTAFiles ${showPWbar ? "pwTAFileswBar" : ""}`}>
                    {files.map((file, i) => {
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        const previewUrl = URL.createObjectURL(file);
                        return (
                            <div key={i} className="chatTAFile">
                                <div className="chatTAFileOverlay" onClick={() => {
                                    setFiles(prev => prev.filter((_, idx) => idx !== i));
                                }}>
                                    <X/>
                                </div>
                                {isImage ? (
                                    <img src={previewUrl} alt={file.name} className="chatTAFilePreview" />
                                ) : isVideo ? (
                                    <video src={previewUrl} className="chatTAFilePreview" controls />
                                ) : (
                                    <div className="chatTAFileOther">
                                    {GetIconByType(file.name, file.type)}
                                    <span className="chatTAFileName">{file.name}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <textarea
                value={text} 
                className={`postWriteTA ${showPWbar || files.length > 0 ? "PWTAwFiles" : ""}`} 
                ref={textAreaRef} 
                onChange={(e) => setText(e.target.value)} 
                onFocus={()=>setShowPWbar(true)}
                placeholder="Расскажите что-нибудь..."
            >
            </textarea>
            <input
                type="file"
                multiple
                style={{ display: "none" }}
                ref={inputFileRef}
                onChange={(e) => {
                    if (!e.target.files) return;
                    setFiles(prev => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])]);
                }}
            />
        </div>
    )
}