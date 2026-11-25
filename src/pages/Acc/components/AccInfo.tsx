import TA from "../../../components/ts/TA";
import "../scss/AccInfo.scss";
import "react-datepicker/dist/react-datepicker.css";
import { Camera, UserRound } from "lucide-react";
import { useUpUser } from "../../../components/hooks/UpdateUserHook";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useCompactLayout from "../../../components/hooks/utils/useCompactLayout";
import { useAcc } from "../../../components/hooks/AccHook";
import { useUser } from "../../../components/hooks/UserHook";
import { useSideMenu } from "../../../components/hooks/SideMenuHook";
import type { User } from "../../../components/context/UserContext";
import DatePicker from "react-datepicker";
import DatePickerHeader from "../../../components/ts/DatePickerHeader";
import { useTranslation } from "react-i18next";
import { enGB, ru } from "date-fns/locale";
import { useContacts } from "../../../components/hooks/ContactsHook";
import { CircleIcon, CheckIcon, DotsThreeOutlineVerticalIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import useContactAlias from "../../../components/hooks/utils/useContactAlias";
import { useNote } from "../../../components/hooks/NoteHook";
export default function AccInfo({
    acc,
    collapsed,
    onHeightChange
}: {
    acc?: User;
    collapsed: number;
    onHeightChange?: (height: number) => void;
}) {
    const isMobile = useCompactLayout();
    const { t, i18n } = useTranslation("acc");
    const { setBlackout } = useBlackout();
    const {
        newName,
        setNewName,
        newNick,
        setNewNick,
        newPick,
        newBio,
        setNewBio,
        newBirth,
        setNewBirth
    } = useUpUser();
    const { onlineMap } = useContacts();
    const isOnline = acc?.can_view_presence !== false && (onlineMap[acc?.id || ""] ?? acc?.is_online ?? false);
    const lastSeen = formatLastOnline(acc?.last_online);
    const { isMyAcc } = useAcc();
    const { user } = useUser();
    const {
        red,
        setRed
    } = useSideMenu();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const navigate = useNavigate();
    const { openMenu, closeMenu, menu } = useContextMenu();
    const [alias, setAlias] = useContactAlias(acc?.id ?? undefined);
    const { showNotification } = useNote();
    const [aliasSaving, setAliasSaving] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [aliasDraft, setAliasDraft] = useState("");
    useEffect(() => { setRenaming(false); }, [acc?.id]);
    const displayName = isMyAcc ? newName : alias || acc?.username;
    const openActions = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!acc?.id) return;
        if (menu.visible && menu.point === "profileActions") { closeMenu(); return; }
        openMenu(event.clientX, event.clientY, "profileActions", {
            id: acc.id, name: acc.username || acc.nick || "", nick: acc.nick || undefined,
            url: acc.avatar_url || undefined, isMy: isMyAcc,
            onEdit: isMyAcc ? () => setRed(true) : user.id ? () => { setAliasDraft(alias || acc.username || acc.nick || ""); setRenaming(true); } : undefined,
            onOpen: user.id && !isMyAcc ? () => navigate(`/chat/${acc.nick}`) : undefined,
            onShare: () => setBlackout({ seted: true, module: "ShareAcc", options: { name: acc.username || "", nick: acc.nick || "", url: acc.avatar_url || "" } })
        });
    };
    const fileInputRef = useRef<HTMLInputElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const bioRef = useRef<HTMLTextAreaElement>(null);
    const [infoHeight, setInfoHeight] = useState<number | null>(null);

    useLayoutEffect(
        () => {
            const inner = innerRef.current;
            if (!inner) return;
            const measure = () => {
                const height = inner.getBoundingClientRect().height;
                setInfoHeight(prev => prev === height ? prev : height);
                if (onHeightChange) onHeightChange(height);
            };
            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(inner);
            return () => observer.disconnect();
        },
        [onHeightChange]
    );

    useEffect(
        () => {
            if (newPick instanceof File) {
                const url = URL.createObjectURL(newPick);
                setPreviewUrl(url);
                return () => URL.revokeObjectURL(url);
            } else {
                setPreviewUrl(null);
            }
        },
        [newPick]
    );

    useLayoutEffect(
        () => {
            const el = bioRef.current;
            if (!el) return;
            el.style.height = "25px";
            el.style.height = el.scrollHeight + 1 + "px";
        },
        [acc?.bio, newBio, red]
    );
    const birthDisplay = (isMyAcc ? newBirth : acc?.date_of_birth)?.split("-").reverse().join(".") || "";
    const birthDate = (isMyAcc ? newBirth : acc?.date_of_birth) ? (() => {
        const [year, month, day] = (isMyAcc ? newBirth : acc?.date_of_birth)!.split("-").map(Number);
        return new Date(year, month - 1, day);
    })() : null;

    return (
        <div
            className={`accInfo`}
            style={{
                height: infoHeight === null ? undefined : `${infoHeight * (1 - collapsed)}px`,
                opacity: 1 - collapsed,
                marginTop: `calc(var(--acc-info-margin-top, 0px) * ${1 - collapsed})`,
                pointerEvents: collapsed === 1 ? "none" : undefined
            }}
        >
            <div className="accInfoInner" ref={innerRef}>
                <div className="accInfoMain" onContextMenu={openActions}>
                    <div className="accPic" onClick={() => isMyAcc && red && fileInputRef.current?.click()}>
                        <input
                            type="file"
                            className="accPicksfileInput"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={e => e.target.files && setBlackout(
                                {
                                    seted: true,
                                    module: "PickHandler",
                                    pick: e.target.files[0]
                                }
                            )}
                        />
                        {previewUrl ? <img src={previewUrl} alt="avatar preview" className="avatarImg" /> : acc?.avatar_url && acc.avatar_url !== null ? <img
                            src={acc.avatar_url}
                            alt="avatar"
                            className="avatarImg"
                            onClick={() => {
                                if (!red) setBlackout(
                                    {
                                        seted: true,
                                        module: "ImgPrev",
                                        img: acc.avatar_url ?? undefined
                                    }
                                );
                            }}
                        /> : red ? <Camera size={256} /> : <UserRound size={128} />}
                        {(isOnline || lastSeen) && <div className={`accOnlineStauts ${isOnline ? "online" : "offline"}`}>
                            <CircleIcon size={16} weight="fill" aria-hidden="true" />
                            {isOnline ? t("online") : lastSeen}
                        </div>}
                    </div>
                    <div className="accInfoNames">
                        <div className="accMainInfoStr">
                            {red || renaming ? <input
                                className="accInput nameInput"
                                value={renaming ? aliasDraft : newName ?? ""}
                                maxLength={renaming ? 40 : undefined}
                                onChange={e => renaming ? setAliasDraft(e.currentTarget.value) : setNewName(e.currentTarget.value)}
                            /> : <span className="accInput nameInput accSelectableValue">
                                {displayName ?? ""}
                            </span>}
                        </div>
                        <div className="accNickStr">
                            {!isMobile && "@"}
                            {red ? <input
                                className="accInput nickInput"
                                value={(isMyAcc ? newNick : acc?.nick) ?? ""}
                                onChange={e => setNewNick(e.currentTarget.value)}
                            /> : <span className="accInput nickInput accSelectableValue">
                                {(isMyAcc ? newNick : acc?.nick) ?? ""}
                            </span>}
                        </div>
                    </div>
                    {acc?.id && !red && !renaming && <button type="button" className="accProfileActions" aria-label={t("actions")} onClick={openActions}><DotsThreeOutlineVerticalIcon weight="fill" size={22}/></button>}
                </div>
                <div className="accInfoWrapper">
                    {acc?.bio || red ? <div className={`accExtraInfoWrapper ${!red ? "dis" : ""}`}>
                        <label htmlFor="extraInfoInputBio">
                            {t("about")}
                        </label>
                        {red ? <TA
                            className="bioTA extraInfoInput"
                            taRef={bioRef}
                            id="extraInfoInputBio"
                            value={(isMyAcc ? newBio : acc?.bio) ?? ""}
                            onChange={e => setNewBio(e.currentTarget.value)}
                        /> : <span className="bioTA extraInfoInput accSelectableValue">
                            {(isMyAcc ? newBio : acc?.bio) ?? ""}
                        </span>}
                    </div> : ""}
                    {acc?.date_of_birth || red ? <div className={`accExtraInfoWrapper ${!red ? "dis" : ""}`}>
                        <label htmlFor="extraInfoInputBirth">
                            {t("birthday")}
                        </label>
                        {red ? <DatePicker
                            className="extraInfoInput"
                            id="extraInfoInputBirth"
                            selected={birthDate}
                            locale={i18n.resolvedLanguage?.startsWith("en") ? enGB : ru}
                            onChange={date => setNewBirth(date ? date.toISOString().split("T")[0] : "")}
                            maxDate={new Date()}
                            readOnly={!red}
                            dateFormat="dd.MM.yyyy"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            yearDropdownItemNumber={100}
                            scrollableYearDropdown
                            popperPlacement="bottom-start"
                            portalId="root"
                            renderCustomHeader={props => <DatePickerHeader {...props} />}
                        /> : <span className="extraInfoInput accSelectableValue">{birthDisplay}</span>}
                    </div> : ""}
                    {(red || renaming) && <div className="accExtraInfoWrapper">
                        <div className="settingInnerList">
                            <div className="settingInnerButt" aria-disabled={aliasSaving} onClick={async () => {
                                if (aliasSaving) return;
                                if (renaming) {
                                    setAliasSaving(true);
                                    try {
                                        await setAlias(aliasDraft.trim() === (acc?.username || "") ? "" : aliasDraft.trim());
                                        setRenaming(false);
                                    } catch {
                                        showNotification("error", t("renameFailed"));
                                    } finally {
                                        setAliasSaving(false);
                                    }
                                } else setRed(false);
                            }}>
                                <CheckIcon size={20} /> {t("save")}
                            </div>
                        </div>
                    </div>}
                </div>
            </div>
        </div>
    );
}
