import { Camera, UserRound } from "lucide-react";
import { useUpUser } from "../../../components/hooks/UpdateUserHook";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import { useAcc } from "../../../components/hooks/AccHook";
import { useSideMenu } from "../../../components/hooks/SideMenuHook";
import type { User } from "../../../components/context/UserContext";
import type { PrivateSettings } from "../../../components/context/SettingsContext";
import DatePicker from "react-datepicker";
import DatePickerHeader from "../../../components/ts/DatePickerHeader";
import { useTranslation } from "react-i18next";
import { useContacts } from "../../../components/hooks/ContactsHook";
import { ChatTeardropTextIcon, FloppyDiskBackIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";

export default function AccInfo({ acc, canView, collapsed }: { acc?: User, canView: (field: keyof PrivateSettings) => boolean, collapsed: number }) {
    const { t } = useTranslation("acc");
    const { setBlackout } = useBlackout();
    const { newName, setNewName, newNick, setNewNick, newPick, newBio, setNewBio, newBirth, setNewBirth } = useUpUser();
    const { onlineMap } = useContacts();
    const { isMyAcc } = useAcc();
    const { red, setRed } = useSideMenu();
    const [ previewUrl, setPreviewUrl ] = useState<string | null>(null);

    const navigate = useNavigate()

    const page = location.pathname.split("/")[1]
    console.log(page)
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

    const birthDate = (isMyAcc ? newBirth : acc?.date_of_birth)
        ? (() => {
            const [year, month, day] = (isMyAcc ? newBirth : acc?.date_of_birth)!
                .split("-")
                .map(Number);

            return new Date(year, month - 1, day);
        })()
        : null;

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
                        <img src={previewUrl} alt="avatar preview" className="avatarImg" />
                    ) : acc?.avatar_url && acc.avatar_url !== null ? (
                        <img src={acc.avatar_url} alt="avatar" className="avatarImg" onClick={() => { if (!red) setBlackout({ seted: true, module: "ImgPrev", img: acc.avatar_url ?? undefined }) }} />
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
                            ? t("online")
                            : formatLastOnline(acc?.last_online)}
                    </div>
                </div>
            </div>

            <div className="accInfoWrapper">
                {acc?.bio || red ? (
                    <div className="accExtraInfoWrapper">
                        <label htmlFor="extraInfoInputBio">{t("about")}</label>
                        <textarea
                            className="bioTA extraInfoInput"
                            id="extraInfoInputBio"
                            value={(isMyAcc ? newBio : acc?.bio) ?? ""}
                            readOnly={!red}
                            onChange={(e) =>
                                setNewBio(e.currentTarget.value)
                            }
                        />
                    </div>
                ) : ""}

                {acc?.date_of_birth || red ? (
                    <div className="accExtraInfoWrapper" >
                        <label htmlFor="extraInfoInputBirth">{t("birthday")}</label>
                        <DatePicker
                            className="extraInfoInput"
                            id="extraInfoInputBirth"
                            selected={birthDate}
                            onChange={(date) =>
                                setNewBirth(
                                    date
                                        ? date.toISOString().split("T")[0]
                                        : ""
                                )
                            }
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
                            renderCustomHeader={(props) => (
                                <DatePickerHeader {...props} />
                            )}
                        />
                    </div>
                ) : ""}
                <div className={`accExtraInfoWrapper ${red ? "disabled" : ""}`}>
                    {!canView("number") ? (
                        <span>{t("hidden")}</span>
                    ) : (
                        <>
                            <label htmlFor="extraInfoInputPhone">{t("phone")}</label>
                            <input
                                id="extraInfoInputPhone"
                                className={`extraInfoInput ${red ? "disabled" : ""}`}
                                value="—"
                                readOnly
                            />
                        </>
                    )}
                </div>
                    <div className="accExtraInfoWrapper">
                        <div className="settingInnerList">
                            <div className="settingInnerButt" onClick={() => {
                                if (isMyAcc) {
                                    if (red === true) setRed(false);
                                    else setRed(true);
                                } else {
                                    navigate(`/chat/${acc?.nick}`)
                                }

                            }}>
                            {isMyAcc 
                                ? red
                                    ? (
                                        <>
                                            <FloppyDiskBackIcon weight="fill" size={20}/>{t("save")}
                                        </>
                                    )
                                    : (
                                        <>
                                            <PencilSimpleIcon size={20}/>{t("edit")}
                                        </>
                                    )
                                : (
                                    <>
                                        <ChatTeardropTextIcon size={20}/>Написать сообщение
                                    </>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}