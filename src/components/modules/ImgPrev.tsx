import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNavigate } from "react-router";
import { useMessages } from "../hooks/MessagesHook";
import { ArrowDownToLine, ChevronLeft, ChevronRight, MessageCircleReply } from "lucide-react";
import { UserIcon } from "@phosphor-icons/react";

export default function ImgPrev() {
    const { blackout, setBlackout } = useBlackout();
    const { setPendingScrollId } = useMessages();
    const navigate = useNavigate();
    const { images, imageIndex = 0 } = blackout;
    const { nick, id, name } = blackout.options ?? {};
    const sender = blackout.sender;

    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const swiped = useRef(false);
    const dragging = useRef(false);
    const sliderWidth = useRef(0);
    const changing = useRef(false);
    const [controlsVisible, setControlsVisible] = useState(false);
    const dragX = useMotionValue(0);
    const sliderRef = useRef<HTMLDivElement>(null);

    const currentImages = images?.length
        ? images
        : [{ url: blackout.img ?? "", name, options: blackout.options, sender }];

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 800;

    const showControls = useCallback(() => {
        setControlsVisible(true);

        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
        }

        hideControlsTimer.current = setTimeout(() => {
            setControlsVisible(false);
        }, 3000);
    }, []);

    useEffect(() => {
        return () => {
            if (hideControlsTimer.current) {
                clearTimeout(hideControlsTimer.current);
            }
        };
    }, []);

    const changeImage = useCallback((step: number) => {
        if (currentImages.length < 2 || changing.current) return;

        const nextIndex = (imageIndex + step + currentImages.length) % currentImages.length;
        const next = currentImages[nextIndex];

        setBlackout({
            ...blackout,
            img: next.url,
            imageIndex: nextIndex,
            options: next.options,
            sender: next.sender
        });
    }, [blackout, currentImages, imageIndex, setBlackout]);

    const finishSwipe = useCallback((step: number) => {
        if (changing.current) return;

        changing.current = true;
        const width = sliderWidth.current || window.innerWidth;

        animate(dragX, step > 0 ? -width : width, {
            duration: 0.18,
            ease: [0.22, 1, 0.36, 1],
            onComplete: () => {
                const nextIndex = (imageIndex + step + currentImages.length) % currentImages.length;
                const next = currentImages[nextIndex];

                dragX.set(0);
                setBlackout({
                    ...blackout,
                    img: next.url,
                    imageIndex: nextIndex,
                    options: next.options,
                    sender: next.sender
                });

                changing.current = false;
            }
        });
    }, [dragX, imageIndex, currentImages, blackout, setBlackout]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft") changeImage(-1);
            if (event.key === "ArrowRight") changeImage(1);
            if (event.key === "Escape") setBlackout({ seted: false });
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [changeImage, setBlackout]);

    const handleDownload = async () => {
        if (!blackout.img) return;

        const response = await fetch(blackout.img);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = name || "image";
        a.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (currentImages.length < 2 || changing.current) return;

        touchStartX.current = event.touches[0].clientX;
        touchStartY.current = event.touches[0].clientY;
        sliderWidth.current = sliderRef.current?.offsetWidth ?? window.innerWidth;
        swiped.current = false;
        dragging.current = false;
        dragX.set(0);
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (
            touchStartX.current === null ||
            touchStartY.current === null ||
            changing.current
        ) return;

        const deltaX = event.touches[0].clientX - touchStartX.current;
        const deltaY = event.touches[0].clientY - touchStartY.current;

        if (!dragging.current) {
            if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;
            if (Math.abs(deltaY) > Math.abs(deltaX)) return;

            dragging.current = true;
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            dragX.set(deltaX);
        }
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const deltaX = dragX.get();
        const threshold = Math.min(100, sliderWidth.current * 0.2);

        touchStartX.current = null;
        touchStartY.current = null;

        if (!dragging.current) {
            dragX.set(0);
            return;
        }

        dragging.current = false;
        swiped.current = true;

        if (Math.abs(deltaX) >= threshold) {
            finishSwipe(deltaX < 0 ? 1 : -1);
        } else {
            animate(dragX, 0, {
                type: "spring",
                stiffness: 420,
                damping: 34
            });
        }
    };

    const handleImageClick = (event: React.MouseEvent) => {
        event.stopPropagation();

        if (swiped.current) {
            swiped.current = false;
            return;
        }

        if (isMobile) {
            showControls();
        }
    };

    return (
        <div
            className={`imgPrevDiv${controlsVisible ? " controlsVisible" : ""}`}
            onClick={() => setBlackout({ seted: false })}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <div className="imgPrevSlider" ref={sliderRef}>
                {currentImages.length > 1 ? (
                    [-1, 0, 1].map(offset => {
                        const index = (imageIndex + offset + currentImages.length) % currentImages.length;
                        const image = currentImages[index];

                        return (
                            <motion.div
                                key={`${offset}-${index}-${image.url}`}
                                className={`imgPrevSlide${offset === 0 ? " active" : ""}`}
                                initial={false}
                                style={{
                                    x: dragX,
                                    translateX: `${offset * 100}%`
                                }}
                                animate={{
                                    scale: offset === 0 ? 1 : 0.88,
                                    opacity: offset === 0 ? 1 : 0.55
                                }}
                                transition={{
                                    scale: { duration: 0.2 },
                                    opacity: { duration: 0.2 }
                                }}
                            >
                                <img
                                    src={image.url}
                                    alt={image.name || ""}
                                    draggable={false}
                                    onClick={handleImageClick}
                                />
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="imgPrevSlide active">
                        <img
                            src={blackout.img}
                            alt={name || ""}
                            draggable={false}
                            onClick={handleImageClick}
                        />
                    </div>
                )}
            </div>

            {currentImages.length > 1 && (
                <>
                    <button
                        type="button"
                        className="imgPrevArrow imgPrevArrowLeft"
                        title="Предыдущее фото"
                        onClick={event => {
                            event.stopPropagation();
                            changeImage(-1);
                        }}
                    >
                        <ChevronLeft size={28} />
                    </button>

                    <button
                        type="button"
                        className="imgPrevArrow imgPrevArrowRight"
                        title="Следующее фото"
                        onClick={event => {
                            event.stopPropagation();
                            changeImage(1);
                        }}
                    >
                        <ChevronRight size={28} />
                    </button>

                    <div className="imgPrevCounter">
                        {imageIndex + 1} / {currentImages.length}
                    </div>
                </>
            )}

            <div className="imgPrevMenu" onClick={event => event.stopPropagation()}>
                {nick && id && (
                    <div
                        className="imgPrevToMessage imgPrevMenuButt"
                        title="Перейти к сообщению"
                        onClick={() => {
                            navigate(`/chat/${nick}`);
                            setPendingScrollId(Number(id));
                            setBlackout({ seted: false });
                        }}
                    >
                        <MessageCircleReply size={22} />
                    </div>
                )}

                {sender && (
                    <div
                        className="modulesenderInfo"
                        onClick={() => {
                            navigate(`/acc/${sender.nick}`);
                            setBlackout({ seted: false });
                        }}
                    >
                        <div className="senderInfoPic">
                            {sender.url
                                ? <img src={sender.url} alt={sender.nick} />
                                : <UserIcon size={22} />}
                        </div>

                        <div className="senderInfoMain">
                            {sender.name && <span>{sender.name}</span>}
                            <span>{sender.nick}</span>
                        </div>
                    </div>
                )}

                <div
                    className="imgPrevToMessage imgPrevMenuButt"
                    title="Скачать"
                    onClick={() => void handleDownload()}
                >
                    <ArrowDownToLine size={22} />
                </div>
            </div>
        </div>
    );
}