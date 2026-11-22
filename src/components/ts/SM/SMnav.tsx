import { useUser } from "../../hooks/UserHook";
import { CircleUserRound, Megaphone } from "lucide-react";
import { CalendarCheckIcon, CalendarPlusIcon, ChatTeardropIcon, GearIcon, NewspaperIcon, SneakerMoveIcon, PlusIcon, SignOutIcon, UserIcon, CheckIcon, MagnifyingGlassIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { useSideMenu } from "../../hooks/SideMenuHook";
import { useContextMenu } from "../../hooks/ContextMenuHook";
import { useEffect, useRef, useState } from "react";
import type { tab } from "../../context/SideMenuContext";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useNote } from "../../hooks/NoteHook";
import { useNavigate } from "react-router";
import useCompactLayout from "../../hooks/utils/useCompactLayout";
import { useSettings } from "../../hooks/SettingsHook";
import { useContacts } from "../../hooks/ContactsHook";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import "../../../scss/Loading.scss";
import { formatSMSearchQuery, parseSMSearchQuery, searchTabFilters, searchTabForFilter, type SearchFilter } from "../utils/globalSearchQuery";

function NavAvatar({ src, alt }: { src: string; alt: string }) {
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

    if (status === "error") return <CircleUserRound/>;

    return <>
        {status === "loading" && <span className="skeletonCircle smNavAvatarSkeleton" aria-hidden="true"/>}
        <img src={src} alt={alt} className={status === "loading" ? "smNavAvatarPending" : ""}
            onLoad={() => setStatus("ready")} onError={() => setStatus("error")}/>
    </>;
}

export default function SMnav() {
    const isMobile = useCompactLayout();
    const studio = useLocation().pathname.startsWith("/wallpapers");
    const {
        user,
        logOut,
        loadingUser
    } = useUser();
    const {
        setActiveTab,
        activeTab,
        searchMode,
        setSearchMode,
        searchQuery,
        setSearchQuery,
        settingsSearch,
        setSettingsSearch,
        messageSelectedValue,
        setMessageSelectedValue,
        habitsSelectedValue,
        setHabitsSelectedValue,
        chatsFilters,
        habitsFilters,
        setDontHandle,
        setDontHandleOther,
        translateX,
        setTranslateX,
        setIsDragging,
        showSideMenu,
        closeMenu,
        openSideMenu,
        startupTabAnimationReady
    } = useSideMenu();
    const { menu: contextMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { layout } = useSettings();
    const { showNotification } = useNote();
    const {
        search: contactSearch,
        setSearch: setContactSearch,
        list: contacts
    } = useContacts();
    const search = searchMode ? searchQuery : activeTab === "user" ? settingsSearch : contactSearch;
    const parsedSearch = parseSMSearchQuery(searchQuery);
    const setSearch = searchMode ? setSearchQuery : activeTab === "user" ? setSettingsSearch : setContactSearch;
    const navigate = useNavigate();
    const { t } = useTranslation("common");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suppressMouseUntil = useRef(0);
    const touchTab = useRef<tab | null>(null);
    const [extraMenu, setExtraMenu] = useState<tab>();
    const [isExtraOpen, setIsExtraOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const timerRef = useRef<number | null>(null);
    const longPressTriggered = useRef(false);
    const wasLongPress = useRef(false);
    const isPointerDown = useRef(false);
    const touchStartPos = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const filtersRef = useRef<HTMLDivElement>(null);
    const touchHoverRef = useRef<HTMLElement | null>(null);
    const swipeStartX = useRef(0);
    const swipeStartY = useRef(0);
    const swipeStartTranslate = useRef(0);
    const swipeCurrentTranslate = useRef(0);
    const gesture = useRef<"none" | "menu" | "scroll" | "longpress">("none");

    useEffect(
        () => {
            const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                if (isPointerDown.current || wasLongPress.current) return;
                const target = event.target as Node;
                if (filtersRef.current?.contains(target) || tabsRef.current?.contains(target)) return;
                setIsExtraOpen(false);
            };
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("touchstart", handleClickOutside);
            };
        },
        []
    );
    const startLongPress = (tab: tab, clientX?: number, clientY?: number) => {
        if (contextMenu.visible) return;
        isPointerDown.current = true;
        longPressTriggered.current = false;
        wasLongPress.current = false;
        gesture.current = "none";
        if (timerRef.current) clearTimeout(timerRef.current);
        if (clientX !== undefined && clientY !== undefined) {
            touchStartPos.current = {
                x: clientX,
                y: clientY
            };
            swipeStartX.current = clientX;
            swipeStartY.current = clientY;
            swipeStartTranslate.current = translateX;
            swipeCurrentTranslate.current = translateX;
        }
        timerRef.current = window.setTimeout(
            () => {
                longPressTriggered.current = true;
                wasLongPress.current = true;
                gesture.current = "longpress";
                setDontHandle(true);
                setExtraMenu(tab);
                setIsExtraOpen(true);
            },
            350
        );
    };
    const cancelLongPress = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        longPressTriggered.current = false;
        touchStartPos.current = null;
        setDontHandle(false);
        setDontHandleOther(false);
    };
    const handleNavTouchStart = (tab: tab, e: React.TouchEvent) => {
        if (contextMenu.visible || e.touches.length !== 1) return;
        suppressMouseUntil.current = performance.now() + 800;
        touchTab.current = tab;
        const touch = e.touches[0];
        startLongPress(tab, touch.clientX, touch.clientY);
    };
    const handleNavTouchMove = (e: React.TouchEvent) => {
        if (contextMenu.visible) return;
        const touch = e.touches[0];
        if (longPressTriggered.current || gesture.current === "longpress") {
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const extraButton = element?.closest(".SMextraMenuButt") as HTMLElement | null;
            const filter = element?.closest(".filterItem") as HTMLElement | null;
            const nav = element?.closest(".SMnavButt") as HTMLElement | null;
            if (extraButton) {
                setTouchHover(extraButton);
                return;
            }
            if (filter) {
                setTouchHover(filter);
                return;
            }
            if (nav) {
                const tab = nav.dataset.tab as tab | undefined;
                if (tab) setExtraMenu(tab);
                setTouchHover(nav);
                return;
            }
            setTouchHover(null);
            return;
        }
        const dx = touch.clientX - swipeStartX.current;
        const dy = touch.clientY - swipeStartY.current;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (gesture.current === "none") {
            if (absX < 10 && absY < 10) return;
            if (absY > absX) {
                gesture.current = "scroll";
                cancelLongPress();
                setTouchHover(null);
                return;
            }
            gesture.current = "menu";
            cancelLongPress();
            setIsDragging(true);
            setDontHandle(false);
            setDontHandleOther(true);
        }
        if (gesture.current !== "menu") return;
        const diffPercent = dx / window.innerWidth * 100;
        let next = swipeStartTranslate.current + diffPercent;
        next = Math.max(-100, Math.min(0, next));
        swipeCurrentTranslate.current = next;
        setTranslateX(next);
    };
    const handleNavTouchEnd = (event: React.TouchEvent) => {
        if (contextMenu.visible) {
            cancelTouch();
            return;
        }
        const touch = event.changedTouches[0];
        const target = touch ? document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>(".SMnavButt") : null;
        if (gesture.current === "none" && !wasLongPress.current && target?.dataset.tab === touchTab.current && touchTab.current) navFunc(touchTab.current);
        touchTab.current = null;
        if (gesture.current === "menu") {
            setIsDragging(false);
            // SMnav used a -40% position threshold before direction-based
            // completion replaced it. Keep the same final animation as SM.
            if (swipeCurrentTranslate.current < -40) closeMenu();
            else openSideMenu();
        }
        if (!wasLongPress.current) {
            cancelLongPress();
        }
        gesture.current = "none";
        isPointerDown.current = false;
    };
    const selectSearchFilter = (filter: SearchFilter | null) => {
        setSearchQuery(formatSMSearchQuery(filter, parsedSearch.query));
        if (filter) setActiveTab(searchTabForFilter(filter));
        setIsExtraOpen(false);
        requestAnimationFrame(() => searchInputRef.current?.focus());
    };
    const switchSearchTab = (next: tab) => {
        if (searchMode && parsedSearch.filter && searchTabForFilter(parsedSearch.filter) !== next) {
            setSearchQuery(parsedSearch.query);
        }
        setActiveTab(next);
    };
    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
        if (contextMenu.visible) {
            cancelTouch();
            return;
        }
        const wasLongPressNow = wasLongPress.current;
        isPointerDown.current = false;
        if (!wasLongPressNow) {
            cancelLongPress();
            wasLongPress.current = false;
            return;
        }
        let clientX: number;
        let clientY: number;
        if ("changedTouches" in e) {
            const touch = e.changedTouches[0];
            if (!touch) {
                setTouchHover(null);
                setIsExtraOpen(false);
                cancelLongPress();
                wasLongPress.current = false;
                return;
            }
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const element = document.elementFromPoint(clientX, clientY);
        const extraTarget = element?.closest(".SMextraMenuButt") as HTMLElement | null;
        const filterTarget = element?.closest(".filterItem") as HTMLElement | null;
        const navTarget = element?.closest(".SMnavButt") as HTMLElement | null;
        if (extraTarget) {
            const action = extraTarget.dataset.action;
            if (action === "search-filter") {
                selectSearchFilter((extraTarget.dataset.value || null) as SearchFilter | null);
                cancelLongPress();
                return;
            }
            if (action === "create-chat") {
                setBlackout(
                    {
                        seted: true,
                        module: "CreateChat"
                    }
                );
            }
            if (action === "add-habit") {
                setBlackout(
                    {
                        seted: true,
                        module: "AddHabit"
                    }
                );
            }
            if (action === "add-plan") {
                setBlackout(
                    {
                        seted: true,
                        module: "AddPlan"
                    }
                );
            }
            if (action === "new-spot") {
                showNotification("info", t("sideMenu.inDevelopment"));
            }
            if (action === "posts") {
                closeMenu();
                navigate("/");
            }
            if (action === "habits") {
                closeMenu();
                navigate("/habit");
            }
            if (action === "profile") {
                closeMenu();
                navigate(`/acc/${user.nick}`);
            }
            if (action === "settings") {
                closeMenu();
                navigate(`/settings`);
            }
            if (action === "logout") {
                if (!confirmLogout) {
                    setConfirmLogout(true);
                    setTouchHover(null);
                    cancelLongPress();
                    wasLongPress.current = false;
                    return;
                } else logOut();
            }
            setTouchHover(null);
            setIsExtraOpen(false);
            cancelLongPress();
            wasLongPress.current = false;
            return;
        }
        if (filterTarget) {
            const value = filterTarget.dataset.value;
            const type = filterTarget.dataset.type;
            if (value && type === "chats") {
                setMessageSelectedValue(value);
                setActiveTab("chats");
            }
            if (value && type === "habits") {
                setHabitsSelectedValue(value);
                setActiveTab("habits");
            }
            setTouchHover(null);
            setIsExtraOpen(false);
            cancelLongPress();
            wasLongPress.current = false;
            return;
        }
        if (navTarget) {
            const tab = navTarget.dataset.tab as tab | undefined;
            if (tab) {
                switchSearchTab(tab);
                setExtraMenu(tab);
            }
            setTouchHover(null);
            setIsExtraOpen(false);
            cancelLongPress();
            wasLongPress.current = false;
            return;
        }
        setTouchHover(null);
        setIsExtraOpen(false);
        cancelLongPress();
        wasLongPress.current = false;
    };
    const pointerUpRef = useRef(handlePointerUp);
    pointerUpRef.current = handlePointerUp;
    const cancelTouch = () => {
        setIsExtraOpen(false);
        touchTab.current = null;
        isPointerDown.current = false;
        wasLongPress.current = false;
        gesture.current = "none";
        cancelLongPress();
        setTouchHover(null);
        setIsDragging(false);
    };

    useEffect(
        () => {
            const release = (event: MouseEvent | TouchEvent) => pointerUpRef.current(event);
            document.addEventListener("mouseup", release);
            document.addEventListener("touchend", release);
            return () => {
                document.removeEventListener("mouseup", release);
                document.removeEventListener("touchend", release);
                if (timerRef.current) clearTimeout(timerRef.current);
                touchHoverRef.current?.classList.remove("touchHover");
            };
        },
        []
    );
    const handleNavEnter = (tab: tab) => {
        if (contextMenu.visible) return;
        if (longPressTriggered.current) {
            setExtraMenu(tab);
        }
    };
    const navFunc = (tab: tab) => {
        if (contextMenu.visible || wasLongPress.current) return;
        if (tab !== activeTab) {
            setExtraMenu(tab);
            switchSearchTab(tab);
        } else {
            setExtraMenu(tab);
            setIsExtraOpen(prev => !prev);
        }
    };
    const setTouchHover = (element: HTMLElement | null) => {
        if (touchHoverRef.current === element) return;
        touchHoverRef.current?.classList.remove("touchHover");
        if (element) element.classList.add("touchHover");
        touchHoverRef.current = element;
    };
    const messageSelected = chatsFilters.find(f => f.value === messageSelectedValue) ?? {
        label: t("sideMenu.all"),
        value: "chats",
        new: ""
    };
    const habitsSelected = habitsFilters.find(f => f.value === habitsSelectedValue) ?? {
        label: t("sideMenu.all"),
        value: "all",
        new: "0"
    };
    const unreadMessages = chatsFilters.find(filter => filter.value === "chats")?.new || "";
    const unreadContacts = contacts.filter(contact => contact.unread_count > 0);
    const allUnreadMuted = unreadContacts.length > 0 && unreadContacts.every(contact => contact.note === false);

    useEffect(
        () => {
            let timer: number | null = null;
            if (!isExtraOpen || extraMenu !== "user") {
                timer = window.setTimeout(() => {
                    setConfirmLogout(false);
                }, 300);
            }
            return () => {
                if (timer !== null) {
                    clearTimeout(timer);
                }
            };
        },
        [extraMenu, isExtraOpen]
    );
    const extraButts = () => {
        if (searchMode) return [null, ...searchTabFilters[extraMenu || activeTab]].map(filter => <div
            className={"SMextraMenuButt " + (parsedSearch.filter === filter ? "selected" : "")}
            key={filter || "none"}
            data-action="search-filter"
            data-value={filter || ""}
            onMouseUp={() => selectSearchFilter(filter)}>
            {t("sideMenu.searchFilter." + (filter || "none"))}
        </div>);
        switch (extraMenu) {
            case "chats":
                return (
                    <div
                        className="SMextraMenuButt"
                        data-action="create-chat"
                        onMouseUp={() => {
                            setBlackout(
                                {
                                    seted: true,
                                    module: "CreateChat"
                                }
                            );
                            setIsExtraOpen(false);
                        }}
                    >
                        <PlusIcon size={20} /> {t("sideMenu.newChat")}
                    </div>
                );
            case "habits":
                return (<>
                    <div
                        className="SMextraMenuButt"
                        onMouseUp={() => {
                            setBlackout(
                                {
                                    seted: true,
                                    module: "AddHabit"
                                }
                            );
                            setIsExtraOpen(false);
                        }}
                        data-action="add-habit"
                    >
                        <PlusIcon size={20} /> {t("sideMenu.newActivity")}
                    </div>
                    <div
                        className="SMextraMenuButt"
                        onMouseUp={() => {
                            setBlackout(
                                {
                                    seted: true,
                                    module: "AddPlan"
                                }
                            );
                            setIsExtraOpen(false);
                        }}
                        data-action="add-plan"
                    >
                        <CalendarPlusIcon size={20} /> {t("plans.create")}
                    </div>
                </>);
            case "spots":
                return (
                    <div
                        className="SMextraMenuButt"
                        onMouseUp={() => {
                            showNotification("info", t("sideMenu.inDevelopment"));
                            setIsExtraOpen(false);
                        }}
                        data-action="new-spot"
                    >
                        <PlusIcon size={20} /> {t("sideMenu.newSpot")}
                    </div>
                );
            case "user":
                return (
                    <>
                        <div
                            className={`SMextraMenuButt user ${location.pathname === `/acc/${user.nick}` ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate(`/acc/${user.nick}`);
                                setIsExtraOpen(false);
                            }}
                            data-action="profile"
                        >
                            <UserIcon weight="fill" size={20} /> {t("sideMenu.profile")}
                        </div>
                        <div
                            className={`SMextraMenuButt user ${location.pathname === "/" ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate("/");
                                setIsExtraOpen(false);
                            }}
                            data-action="posts"
                        >
                            <NewspaperIcon weight="fill" size={20} /> {t("sideMenu.feed")}
                        </div>
                        <div
                            className={`SMextraMenuButt user ${location.pathname === "/habit" ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate("/habit");
                                setIsExtraOpen(false);
                            }}
                            data-action="habits"
                        >
                            <SneakerMoveIcon weight="fill" size={20} /> {t("sideMenu.plansAndActivities")}
                        </div>
                        <div
                            className={`SMextraMenuButt user ${location.pathname.includes("/settings") ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate(`/settings`);
                                setIsExtraOpen(false);
                            }}
                            data-action="settings"
                        >
                            <GearIcon weight="fill" size={20} /> {t("sideMenu.settings")}
                        </div>
                        <span className="SMextraSeparator" />
                        <div
                            className={`SMextraMenuButt logout user ${confirmLogout ? "confirm" : ""}`}
                            onMouseUp={() => {
                                if (!confirmLogout) setConfirmLogout(true); else {
                                    logOut();
                                    setIsExtraOpen(false);
                                }
                            }}
                            data-action="logout"
                        >
                            {!confirmLogout ? <>
                                <SignOutIcon weight="fill" size={20} /> {t("sideMenu.logOut")}
                            </> : <>
                                <CheckIcon size={20} /> {t("sideMenu.confirmLogOut")}
                            </>}
                        </div>
                    </>
                );
        }
    };
    const searchControl = (
            <div className={`smNavSearch ${searchMode ? "active" : "dis"}`}>
                <input
                    ref={searchInputRef}
                    type="text"
                    className="smNavSearchInp"
                    placeholder={t(activeTab === "user" ? "accountNavigation.settingsSearch" : "accountNavigation.search")}
                    aria-label={t(activeTab === "user" ? "accountNavigation.settingsSearch" : "accountNavigation.search")}
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        if (searchMode) {
                            const selected = parseSMSearchQuery(e.target.value).filter;
                            if (selected) setActiveTab(searchTabForFilter(selected));
                        }
                    }}
                />
                <div
                    className=""
                    onClick={() => {
                        if (!searchMode) {
                            setSearchMode(true);
                            requestAnimationFrame(() => searchInputRef.current?.focus());
                        } else {
                            if (search.trim() !== "") setSearch(""); else setSearchMode(false);
                        }
                    }}
                >
                    {searchMode ? search.trim() !== "" ? <XIcon /> : <CaretRightIcon /> : <MagnifyingGlassIcon />}
                </div>
            </div>
    );

    if (!loadingUser && !user.id) return null;

    return (
        <div
            className={`SMnavDiv ${showSideMenu ? "open" : ""}`}
            style={{
                transform: isMobile || layout === "hidden" || studio ? `translateX(${translateX}%)` : "none"
            }}
            onTouchEnd={handleNavTouchEnd}
            onTouchCancel={cancelTouch}
        >
            <div
                className={`SMnavExtraDiv ${isExtraOpen ? "open" : ""} ${extraMenu || ""} ${searchMode ? "upper" : ""}`}
                ref={filtersRef}
            >
                {extraButts()}
            </div>

            <div className={`SMnav ${searchMode ? "dis" : "active"}`} ref={tabsRef}>
                <div className={`SMnavActive ${activeTab}`} style={startupTabAnimationReady ? undefined : { transition: "none" }} />

                <div
                    className={`SMnavButt ${activeTab === "chats" ? "active" : ""}`}
                    data-tab="chats"
                    onContextMenu={e => e.preventDefault()}
                    onMouseDown={() => {
                        if (performance.now() >= suppressMouseUntil.current) startLongPress("chats");
                    }}
                    onMouseUp={() => {
                        if (performance.now() >= suppressMouseUntil.current) navFunc("chats");
                    }}
                    onMouseEnter={() => handleNavEnter("chats")}
                    key={messageSelected.value}
                    onTouchStart={e => handleNavTouchStart("chats", e)}
                    onTouchMove={handleNavTouchMove}
                >
                    <ChatTeardropIcon weight="fill" />
                    {unreadMessages && <span className={`smUnreadBadge smNavUnread ${allUnreadMuted ? "muted" : ""}`}>{unreadMessages}</span>}
                </div>

                <div
                    className={`SMnavButt ${activeTab === "habits" ? "active" : ""}`}
                    data-tab="habits"
                    onContextMenu={e => e.preventDefault()}
                    onMouseDown={() => {
                        if (performance.now() >= suppressMouseUntil.current) startLongPress("habits");
                    }}
                    onMouseUp={() => {
                        if (performance.now() >= suppressMouseUntil.current) navFunc("habits");
                    }}
                    onMouseEnter={() => handleNavEnter("habits")}
                    key={habitsSelected.value}
                    onTouchStart={e => handleNavTouchStart("habits", e)}
                    onTouchMove={handleNavTouchMove}
                >
                    <CalendarCheckIcon weight="fill" />
                </div>

                <div
                    className={`SMnavButt ${activeTab === "spots" ? "active" : ""}`}
                    data-tab="spots"
                    onContextMenu={e => e.preventDefault()}
                    onMouseDown={() => {
                        if (performance.now() >= suppressMouseUntil.current) startLongPress("spots");
                    }}
                    onMouseUp={() => {
                        if (performance.now() >= suppressMouseUntil.current) navFunc("spots");
                    }}
                    onMouseEnter={() => handleNavEnter("spots")}
                    onTouchStart={e => handleNavTouchStart("spots", e)}
                    onTouchMove={handleNavTouchMove}
                >
                    <Megaphone fill="currentColor" />
                </div>

                <div
                    className={`SMnavButt SMnavAvatar ${activeTab === "user" ? "active" : ""}`}
                    data-tab="user"
                    onContextMenu={e => e.preventDefault()}
                    onMouseDown={() => {
                        if (performance.now() >= suppressMouseUntil.current) startLongPress("user");
                    }}
                    onMouseUp={() => {
                        if (performance.now() >= suppressMouseUntil.current) navFunc("user");
                    }}
                    onMouseEnter={() => handleNavEnter("user")}
                    onTouchStart={e => handleNavTouchStart("user", e)}
                    onTouchMove={handleNavTouchMove}
                >
                    {loadingUser ? <span className="skeletonCircle smNavAvatarSkeleton" aria-hidden="true"/> :
                        user?.avatar_url ? <NavAvatar key={user.avatar_url} src={user.avatar_url}
                            alt={user.username ?? user.nick ?? t("sideMenu.photo")}/> : <CircleUserRound />}
                </div>
            </div>
            {searchControl}
        </div>
    );
}
