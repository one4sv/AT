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
import type { PrivateSettings } from "../../../components/context/SettingsContext";
import DatePicker from "react-datepicker";
import DatePickerHeader from "../../../components/ts/DatePickerHeader";
import { useTranslation } from "react-i18next";
import { enGB, ru } from "date-fns/locale";
import { useContacts } from "../../../components/hooks/ContactsHook";
import { CircleIcon, ChatTeardropTextIcon, FloppyDiskBackIcon, PencilSimpleIcon, ShareFatIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { ToggleBlocked } from "../../../components/ts/ContextMenu/buttons/ToggleBlocked";
export default function AccInfo({
    acc,
    canView,
    collapsed,
    onHeightChange
}: {
    acc?: User;
    canView: (field: keyof PrivateSettings) => boolean;
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
                <div className="accInfoMain">
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
                            {red ? <input
                                className="accInput nameInput"
                                value={(isMyAcc ? newName : acc?.username) ?? ""}
                                onChange={e => setNewName(e.currentTarget.value)}
                            /> : <span className="accInput nameInput accSelectableValue">
                                {(isMyAcc ? newName : acc?.username) ?? ""}
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
                    <div className="accExtraInfoWrapper">
                        <div className="settingInnerList">
                            {(isMyAcc || user.id) && <div
                                className="settingInnerButt"
                                onClick={() => {
                                    if (isMyAcc) {
                                        if (red === true) setRed(false); else setRed(true);
                                    } else {
                                        navigate(`/chat/${acc?.nick}`);
                                    }
                                }}
                            >
                                {isMyAcc ? red ? <>
                                    <FloppyDiskBackIcon weight="fill" size={20} />
                                    {t("save")}
                                </> : <>
                                    <PencilSimpleIcon size={20} weight="fill" />
                                    {t("edit")}
                                </> : <>
                                    <ChatTeardropTextIcon size={20} weight="fill" />{t("message")}
                                </>}
                            </div>}
                            <div
                                className="settingInnerButt"
                                onClick={() => setBlackout(
                                    {
                                        seted: true,
                                        module: "ShareAcc",
                                        options: {
                                            name: acc?.username ?? "",
                                            nick: acc?.nick ?? "",
                                            url: acc?.avatar_url || ""
                                        }
                                    }
                                )}
                            >
                                <ShareFatIcon weight="fill" /> {t("share")}
                            </div>
                            {user.id && !isMyAcc && acc?.id && <ToggleBlocked id={acc.id} nick={acc.nick || undefined} name={acc.username || acc.nick || ""} className="settingInnerButt blockUserAction"/>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
