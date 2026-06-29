import { Camera, UserRound } from "lucide-react";
import { useUpUser } from "../../../components/hooks/UpdateUserHook";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useEffect, useRef, useState} from "react";
import { isMobile } from "react-device-detect";
import { useAcc } from "../../../components/hooks/AccHook";
import { useSideMenu } from "../../../components/hooks/SideMenuHook";
import type { User } from "../../../components/context/UserContext";
import type { PrivateSettings } from "../../../components/context/SettingsContext";

export default function AccInfo({acc, canView, collapsed}:{acc?:User, canView: (field:keyof PrivateSettings) => boolean, collapsed:number}) {
    const { setBlackout } = useBlackout();
    const { newName, setNewName, newNick, setNewNick, newPick, newBio, setNewBio, newMail, setNewMail } = useUpUser()
    const { onlineMap } = useChat();
    const { isMyAcc } = useAcc()
    const { red } = useSideMenu()
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (newPick instanceof File) {
            const url = URL.createObjectURL(newPick);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [newPick]);

    useEffect(() => {
        const el = document.querySelector(
            ".bioTA"
        ) as HTMLTextAreaElement | null;

        if (!el) return;

        requestAnimationFrame(() => {
            el.style.height = "25px";
            el.style.height = el.scrollHeight + 1 + "px";
        });
    }, [acc?.bio, newBio]);

    return (
            <div
                className="accInfo"
                style={{
                    maxHeight: `${500 * (1 - collapsed)}px`,
                    opacity: 1 - collapsed,
                    marginTop: `${(0 - collapsed)}vh`,
                    paddingTop: `${0.5 * (1 - collapsed)}vh`,
                    paddingBottom: `${0.5 * (1 - collapsed)}vh`,
                }}
            >
            <div className="accInfoMain">
                <div
                    className="accPic"
                    onClick={() => isMyAcc && red && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        className="accPicksfileInput"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files && setBlackout({ seted: true, module: "PickHandler", pick: e.target.files[0] })}
                    />
                    {previewUrl ? (
                        <img src={previewUrl} alt="avatar preview" className="avatarImg"/>
                    ) : acc?.avatar_url && acc.avatar_url !== null ? (
                        <img src={acc.avatar_url} alt="avatar" className="avatarImg" onClick={() => {if (!red) setBlackout({seted:true, module:"ImgPrev", img:acc.avatar_url ?? undefined})}}/>
                    ) : red ? (
                        <Camera size={256} />
                    ) : (
                        <UserRound size={128} />
                    )}
                </div>
                <div className="accInfoNames">
                    <div className="accMainInfoStr">
                        <input
                            className="accInput nameInput"
                            value={(isMyAcc ? newName : acc?.username) ?? ""}
                            readOnly={!red}
                            onChange={(e) => setNewName(e.currentTarget.value)}
                        />
                    </div>
                    <div>
                        {!isMobile && "@"}
                        <input
                            className="accInput nickInput"
                            value={(isMyAcc ? newNick : acc?.nick) ?? ""}
                            readOnly={!red}
                            onChange={(e) => setNewNick(e.currentTarget.value)}
                        />
                    </div>
                </div>
                <div className="accInfoWrapper">
                    <div className={`accOnlineStauts ${onlineMap[acc?.id || ""] ? "online" : "offline"}`}>
                        {onlineMap[acc?.id || ""] 
                            ? "В сети" 
                            : formatLastOnline(acc?.last_online)}
                    </div>
                </div>
            </div>
            
            <div className="accInfoWrapper">
                <div
                    className="accExtraInfoWrapper"
                    style={{
                        display: acc?.bio || red ? "flex" : "none"
                    }}
                >
                    <label>Описание</label>
                    <textarea
                        className="bioTA extraInfoInput"
                        value={(isMyAcc ? newBio : acc?.bio) ?? ""}
                        readOnly={!red}
                        onChange={(e) =>
                            setNewBio(e.currentTarget.value)
                        }
                    />
                </div>

                <div className="accExtraInfoWrapper">
                    {!canView("number") ? (
                        <span>Скрыто</span>
                    ) : (
                        <>
                            <label>Телефон</label>
                            <input
                                className="extraInfoInput"
                                value="—"
                                readOnly
                            />
                        </>
                    )}
                </div>

                <div className="accExtraInfoWrapper">
                    {!canView("mail") ? (
                        <span>Скрыто</span>
                    ) : (
                        <>
                            <label>Email</label>
                            <input
                                className="extraInfoInput"
                                value={(isMyAcc ? newMail : acc?.mail) ?? ""}
                                onChange={(e) =>
                                    setNewMail(e.currentTarget.value)
                                }
                                readOnly={!red}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}