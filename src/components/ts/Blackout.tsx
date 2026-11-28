import { Suspense, useEffect, useRef, useState } from "react";
import Skeleton from "./Skeleton";
import { useBlackout } from "../hooks/BlackoutHook";
import ModuleMap from "../modules/ModuleMap";
import { useMessages } from "../hooks/MessagesHook";
import { isMobile } from "react-device-detect";
import "../../scss/blackout.scss";
import { useChat } from "../hooks/ChatHook";
import { pauseVideos } from "./utils/videoPlayback";

export default function Blackout() {
    const { blackout, blackoutStack, setBlackout } = useBlackout();
    useEffect(() => { if (blackout.seted) pauseVideos(); }, [blackout.seted, blackoutStack.length, blackout.module]);
    const { redirect, setRedirect, setForwardPost, setForwardMedia, chosenMess, setChosenMess } = useMessages();
    const { setActiveHeader } = useChat();

    const [isOpen, setIsOpen] = useState(false);
    const [visibleStack, setVisibleStack] = useState(blackoutStack);
    const blackoutRef = useRef<HTMLDivElement>(null);
    const blackoutBackgroundRef = useRef<HTMLDivElement>(null);
    const moduleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const startY = useRef(0);
    const startX = useRef(0);
    const chatInfoAxis = useRef<"x" | "y" | null>(null);
    const currentY = useRef(0);
    const dragging = useRef(false);
    const isClosing = useRef(false);
    const closingIndex = useRef<number | null>(null);
    const wasOpen = useRef(false);
    const horizontalSwipe = useRef(false);
    const canDismiss = useRef(true);

    const topIndex = visibleStack.length - 1;

    const closeModal = (index = topIndex) => {
        const module = visibleStack[index];

        if (!module) return;
        if (module.module === "Redirecting") {
            setForwardPost(null);
            setForwardMedia(null);
        }

        if (module.module !== "RedirectMesses") {
            setRedirect(undefined);
        } else {
            setActiveHeader("text");
            setChosenMess([]);
            setRedirect(
                redirect?.filter((m) => chosenMess.some((cm) => cm.id === m.id))
            );
        }

        setBlackout({ seted: false });
    };

    const animateClose = (index = topIndex) => {
        if (isClosing.current) return;

        const module = moduleRefs.current.get(index);

        if (!module) {
            closeModal(index);
            return;
        }

        isClosing.current = true;
        closingIndex.current = index;

        module.style.transition = "none";
        void module.offsetWidth;
        module.style.transition = "transform 0.25s ease";
        module.style.transform = "translateY(100%)";

        setTimeout(() => {
            closeModal(index);
            isClosing.current = false;
            closingIndex.current = null;
        }, 250);
    };

    useEffect(() => {
        if (blackoutStack.length > 0) {
            const isSwitching = wasOpen.current;

            if (isSwitching) {
                const modules = moduleRefs.current;

                modules.forEach((module) => {
                    module.style.transition = "none";
                });

                if (blackoutBackgroundRef.current) {
                    blackoutBackgroundRef.current.style.transition = "none";
                }

                if (blackoutRef.current) {
                    blackoutRef.current.style.transition = "none";
                }
            }

            setVisibleStack(blackoutStack);
            setIsOpen(true);
            isClosing.current = false;

            if (isSwitching) {
                requestAnimationFrame(() => {
                    moduleRefs.current.forEach((module) => {
                        module.style.transition = "none";
                        module.style.transform = "";
                    });

                    if (blackoutBackgroundRef.current) {
                        blackoutBackgroundRef.current.style.transition = "none";
                        blackoutBackgroundRef.current.style.opacity = "1";
                    }

                    if (blackoutRef.current) {
                        blackoutRef.current.style.transition = "none";
                        blackoutRef.current.style.setProperty("--blackout-blur", "12px");
                    }
                });
            }
        } else if (isOpen) {
            // WebKit standalone can retain a stale backdrop-filter tile after
            // the overlay is removed. Invalidate only the header blur layer.
            if (document.documentElement.dataset.iosPwa === "true") {
                const root = document.documentElement;
                root.classList.add("atRepaintHeader");
                requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("atRepaintHeader")));
            }
            setIsOpen(false);
            setVisibleStack([]);
            wasOpen.current = false;
        }
    }, [blackoutStack]);

    useEffect(() => {
        if (!isOpen || !blackout.seted || !isMobile || isClosing.current) return;

        const module = moduleRefs.current.get(topIndex);
        const bg = blackoutBackgroundRef.current;
        const blackoutEl = blackoutRef.current;

        if (!module) return;

        const isFirstOpen = !wasOpen.current;

        if (!isFirstOpen) {
            module.style.transition = "none";
            module.style.transform = "";

            if (bg) {
                bg.style.transition = "none";
                bg.style.opacity = "1";
            }

            if (blackoutEl) {
                blackoutEl.style.transition = "none";
                blackoutEl.style.setProperty("--blackout-blur", "12px");
            }

            return;
        }

        wasOpen.current = true;

        module.style.transition = "none";
        module.style.transform = "translateY(100%)";

        if (bg) {
            bg.style.transition = "none";
            bg.style.opacity = "0";
        }

        if (blackoutEl) {
            blackoutEl.style.transition = "none";
            blackoutEl.style.setProperty("--blackout-blur", "0px");
        }

        void module.offsetWidth;

        module.style.transition = "transform 0.25s ease";
        module.style.transform = "translateY(0)";

        if (bg) {
            bg.style.transition = "opacity 0.25s ease";
            bg.style.opacity = "1";
        }

        if (blackoutEl) {
            blackoutEl.style.transition = "backdrop-filter 0.25s ease";
            blackoutEl.style.setProperty("--blackout-blur", "12px");
        }

        const timer = setTimeout(() => {
            module.style.transition = "";

            if (bg) bg.style.transition = "";
            if (blackoutEl) blackoutEl.style.transition = "";
        }, 250);

        return () => clearTimeout(timer);
    }, [topIndex, isOpen, blackout.seted]);

    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            // TagSelector renders its list into document.body outside the modal tree.
            // A tag selection is part of AddPlan, not a click on the backdrop.
            if (event.target instanceof Element && event.target.closest(".planTagPortal, .selectListPortalRoot, .calendarCommentEmoji")) return;
            if (
                blackoutRef.current &&
                !Array.from(moduleRefs.current.values()).some((module) =>
                    module.contains(event.target as Node)
                )
            ) {
                if (isMobile) {
                    animateClose();
                } else {
                    closeModal();
                }
            }
        };

        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [topIndex, visibleStack, blackout.module]);


    const handleTouchStart = (e: React.TouchEvent, index: number) => {
        if (index !== topIndex || isClosing.current || ["BackgroundFullscreen", "CompositionFullscreen"].includes(visibleStack[index]?.module ?? "")) return;

        const target = e.target as HTMLElement;
        chatInfoAxis.current = null;
        horizontalSwipe.current = false;
        if (target.closest(".chatWithInfoDiv.infoExpanded")) {
            dragging.current = false;
            canDismiss.current = false;
            return;
        }
        // Controls never own the swipe-down-to-dismiss gesture.
        if (target.closest(".selector, button, input, textarea, select, [role='button']")) {
            dragging.current = false;
            canDismiss.current = false;
            return;
        }
        const isImagePreview = !!target.closest(".imgPrevDiv");

        horizontalSwipe.current = false;

        const module = moduleRefs.current.get(index);
        let scrollable = target;
        canDismiss.current = true;
        while (module && module.contains(scrollable)) {
            const style = window.getComputedStyle(scrollable);
            if ((style.overflowY === "auto" || style.overflowY === "scroll") &&
                scrollable.scrollHeight > scrollable.clientHeight + 2) {
                canDismiss.current = scrollable.scrollTop <= 2;
                break;
            }
            if (!scrollable.parentElement) break;
            scrollable = scrollable.parentElement;
        }

        if (isImagePreview) {
            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;

            const handleMove = (event: TouchEvent) => {
                const deltaX = Math.abs(event.touches[0].clientX - startX);
                const deltaY = Math.abs(event.touches[0].clientY - startY);

                if (deltaX > 5 && deltaX > deltaY) {
                    horizontalSwipe.current = true;
                }
            };

            const handleEnd = () => {
                document.removeEventListener("touchmove", handleMove);
                document.removeEventListener("touchend", handleEnd);
                document.removeEventListener("touchcancel", handleEnd);
            };

            document.addEventListener("touchmove", handleMove, { passive: true });
            document.addEventListener("touchend", handleEnd, { once: true });
            document.addEventListener("touchcancel", handleEnd, { once: true });
        }

        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        dragging.current = true;

        if (!canDismiss.current) {
            dragging.current = false;
            return;
        }

        if (module) module.style.transition = "none";

        if (index === 0) {
            if (blackoutRef.current) blackoutRef.current.style.transition = "none";
            if (blackoutBackgroundRef.current) {
                blackoutBackgroundRef.current.style.transition = "none";
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent, index: number) => {
        if (
            index !== topIndex ||
            !dragging.current ||
            isClosing.current ||
            horizontalSwipe.current ||
            !canDismiss.current
        ) return;

        const module = moduleRefs.current.get(index);
        if (!module) return;

        const horizontalSheet = visibleStack[index]?.module === "ChatWithInfo" || visibleStack[index]?.module === "Redirecting";
        if (horizontalSheet && e.defaultPrevented) return;
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;
        if (horizontalSheet) {
            const dx = Math.abs(e.touches[0].clientX - startX.current);
            if (!chatInfoAxis.current && Math.max(dx, Math.abs(diff)) > 8) {
                chatInfoAxis.current = dx >= Math.abs(diff) ? "x" : "y";
            }
            if (chatInfoAxis.current === "x") {
                horizontalSwipe.current = true;
                return;
            }
            if (!chatInfoAxis.current) return;
        }

        if (diff > 0) {
            module.style.transform = `translateY(${diff}px)`;

            if (index === 0) {
                const progress = Math.min(diff / 400, 1);
                const opacity = 1 - progress * 0.65;
                const blur = 12 - progress * 11.2;

                if (blackoutBackgroundRef.current) {
                    blackoutBackgroundRef.current.style.opacity = String(opacity);
                }

                if (blackoutRef.current) {
                    blackoutRef.current.style.setProperty("--blackout-blur", `${blur}px`);
                }
            }
        }
    };


    const handleTouchEnd = (index: number) => {
      if (horizontalSwipe.current) {
        horizontalSwipe.current = false;
        dragging.current = false;
        return;
      }
        if (
            index !== topIndex ||
            !dragging.current ||
            isClosing.current
        ) return;

        dragging.current = false;

        const module = moduleRefs.current.get(index);
        if (!module) return;

        const diff = currentY.current - startY.current;

        if (diff > 100) {
            animateClose(index);
        } else {
            module.style.transition = "transform 0.25s ease";

            if (index === 0) {
                if (blackoutBackgroundRef.current) {
                    blackoutBackgroundRef.current.style.transition = "opacity 0.25s ease";
                    blackoutBackgroundRef.current.style.opacity = "1";
                }

                if (blackoutRef.current) {
                    blackoutRef.current.style.transition = "backdrop-filter 0.25s ease";
                    blackoutRef.current.style.setProperty("--blackout-blur", "12px");
                }
            }

            module.style.transform = "translateY(0)";

            setTimeout(() => {
                module.style.transition = "";

                if (index === 0) {
                    if (blackoutRef.current) blackoutRef.current.style.transition = "";
                    if (blackoutBackgroundRef.current) {
                        blackoutBackgroundRef.current.style.transition = "";
                    }
                }
            }, 250);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="blackout" ref={blackoutRef}>
            <div
                ref={blackoutBackgroundRef}
                className={`blackoutBackground ${blackout.seted ? "open" : "close"}`}
            />
            {visibleStack.map((item, index) => {
                const Component = ModuleMap[item.module ?? ""] ?? null;
                const isTop = index === topIndex;
                const isClosingThis = closingIndex.current === index;

                return (
                    <div
                        key={index}
                        ref={(element) => {
                            if (element) {
                                moduleRefs.current.set(index, element);
                            } else {
                                moduleRefs.current.delete(index);
                            }
                        }}
                        className={`blackoutModule ${isTop ? "open" : "close"} ${["HabitParticipantPicker", "HabitCollaborationSettings", "HabitCreateChat", "HabitDayActivityHistory", "HabitTaskEditor"].includes(item.module || "") ? "habitModalModule" : ""}`}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: index + 1,
                            transform: isClosingThis ? "translateY(100%)" : undefined,
                            pointerEvents: isTop ? "auto" : "none",
                        }}
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        onTouchMove={(e) => handleTouchMove(e, index)}
                        onTouchEnd={() => handleTouchEnd(index)}
                        onTouchCancel={() => {
                            if (visibleStack[index]?.module !== "ChatWithInfo" && visibleStack[index]?.module !== "Redirecting") return;
                            currentY.current = startY.current;
                            handleTouchEnd(index);
                        }}
                        onClick={(e) => {
                            if (!isTop) return;
                            if (e.target === e.currentTarget) {
                                if (isMobile) {
                                    animateClose(index);
                                } else {
                                    closeModal(index);
                                }
                            }
                        }}
                    >
                        {isTop && isMobile && !item.img && !["BackgroundFullscreen", "CompositionFullscreen"].includes(item.module ?? "") && item.module !== "ChatWithInfo" && <div className="mobileBar" />}
                        {Component ? <Suspense fallback={<div className="blackoutModulePending" role="status" aria-busy="true"><Skeleton type="list" count={3}/></div>}><Component /></Suspense> : null}
                    </div>
                );
            })}
        </div>
    );
}