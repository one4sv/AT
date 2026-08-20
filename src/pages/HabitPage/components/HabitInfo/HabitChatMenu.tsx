import { useCallback, useEffect, useRef, useState } from "react";
import RadioGroup from "../../../../components/ts/RadioGroup";
import type { HabitSlideProps } from "../../HabitPage";
import { useNote } from "../../../../components/hooks/NoteHook";
import { useContacts } from "../../../../components/hooks/ContactsHook";
import { type ContactsFilter, type Contact } from "../../../../components/context/ContactsContext";
import CreateChatInfo from "../../../../components/modules/components/CreateChatInfo";
import { CameraIcon, CameraPlusIcon, CheckCircleIcon, CircleIcon, XIcon } from "@phosphor-icons/react";
import { CircleUserRound, SearchIcon } from "lucide-react";
import { LoaderSmall } from "../../../../components/ts/LoaderSmall";

type ChatMenuOption = "personal" | "group" | "add";

export default function HabitChatMenu({ readOnly, isArchived, isMy }: HabitSlideProps) {
    const { findContacts } = useContacts()
    const { showNotification } = useNote()
    const [ selectedOption, setSelectedOption ] = useState<ChatMenuOption>("personal")
    const [ loadingList, setLoadingList ] = useState<boolean>(false);
    const [ chatList, setChatList ] = useState<Contact[]>([])
    const [ search, setSearch ] = useState("")
    const [name, setName] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [pick, setPick] = useState<File | null>(null);
    const [chosenCons, setChosenCons] = useState<Contact[]>([]);

    const abortRef = useRef<AbortController | null>(null);
    
    const listOption = [
        {label:"Добавить в личный чат", value:"personal"},
        {label:"Добавить в беседу", value:"group"},
        {label:"Создать новую беседу", value:"add"},
    ]

    const handleOptionChange = (val: string) => {
        setChosenCons([])
        if (val === "personal" || val === "group" || val === "add") {
            setSelectedOption(val);
        }
    };

    const refetchUsers = useCallback(async () => {
        setLoadingList(true);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const filter: ContactsFilter = selectedOption === "personal" || selectedOption === "group"
                ? selectedOption
                : "personal"
                
            const sortedList = await findContacts(search, controller, filter);

            if (controller.signal.aborted || !sortedList) return;

            setChatList(sortedList);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return;
            showNotification("error", error?.response?.data?.error || "Ошибка загрузки");
        } finally {
            if (!controller.signal.aborted) {
                setLoadingList(false);
            }
        }
    }, [selectedOption, findContacts, search, showNotification]);

    useEffect(() => {
        const timer = setTimeout(refetchUsers, 100);
        return () => {
            clearTimeout(timer);
            abortRef.current?.abort();
        };
    }, [refetchUsers]);
    
    return (
        <div className="habitInnerSlide">
            <div className="habitInnerSlideTitle">
                Добавить в чат
            </div>
            <div className="settingInnerWrapper">
                <div className="settingSpan">
                    Настройки чата
                </div>
                <RadioGroup list={listOption} val={selectedOption} newVal={handleOptionChange} disabled={!isMy || isArchived || readOnly}/>
            </div>
            <span className="chatMenuSpan">
                {selectedOption === "personal" && "Выберите пользователя:"}
                {selectedOption === "group" && "Выберите беседу:"}
                {selectedOption === "add" && "Создать беседу:"}
            </span>
            {selectedOption === "add" && (
                <CreateChatInfo
                    pick={pick}
                    setPick={setPick}
                    name={name}
                    setName={setName}
                    desc={desc}
                    setDesc={setDesc}
                />
            )}
            {(selectedOption === "personal" || selectedOption === "group") && chosenCons[0] && (
                <div className="contactsUser" onClick={() => setChosenCons([])}>
                    <div className="contactsUserPic">
                        {chosenCons[0].avatar_url ? (
                            <img
                                className="contactsUserAvatar"
                                src={chosenCons[0].avatar_url}
                                alt={chosenCons[0].name ?? chosenCons[0].nick}
                            />
                        ) : (
                            <CircleUserRound />
                        )}
                    </div>
                    <div className="contactsUserInfo">
                        <div className="contactsUserStr">
                            <span className="nameSpan">
                                {chosenCons[0].name ?? chosenCons[0].nick}
                            </span>
                            <XIcon />
                        </div>
                    </div>
                </div>
            )}
            <div className="habitChatList">
                <div className="createChatSearch">
                    <input
                        type="text"
                        name="searchList"
                        id="searchList"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <SearchIcon />
                </div>

                <div className="createChatChosenCons">
                    {selectedOption === "add" && chosenCons.length > 0 &&
                        chosenCons.map((con) => (
                            <div
                                key={con.id}
                                className="createChatChosenCon"
                                onClick={() => {
                                    setChosenCons((prev) =>
                                        prev.filter((acc) => acc.id !== con.id)
                                    );
                                }}
                            >
                                <div className="creteChatConPick">
                                    {con.avatar_url ? (
                                        <img src={con.avatar_url} />
                                    ) : (
                                        <CameraPlusIcon />
                                    )}
                                </div>
                                <span>{con.name || con.nick}</span>
                                <div className="createChatConRemove">
                                    <XIcon />
                                </div>
                            </div>
                        ))}
                </div>
                {loadingList ? (
                    <LoaderSmall />
                ) : (
                    chatList.length > 0 &&
                    chatList.map((con) => (
                        <div
                            key={con.id}
                            className="createChatContact"
                            onClick={() => {
                                if (selectedOption === "personal" || selectedOption === "group") setChosenCons([con])
                                else {
                                    setChosenCons((prev) =>
                                        prev.some((acc) => acc.id === con.id)
                                            ? prev.filter((acc) => acc.id !== con.id)
                                            : [...prev, con]
                                    );
                                }
                            }}
                        >
                            <div className="creteChatConPick">
                                {con.avatar_url ? (
                                    <img src={con.avatar_url} />
                                ) : (
                                    <CameraIcon />
                                )}
                            </div>
                            <span>{con.name || con.nick}</span>
                            <div className="createChatConCheck">
                                {chosenCons.some((acc) => acc.id === con.id) ? (
                                    <CheckCircleIcon weight="fill" />
                                ) : (
                                    <CircleIcon />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}