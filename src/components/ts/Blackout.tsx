import { useEffect, useRef, useState } from "react";
import { useBlackout } from "../hooks/BlackoutHook";
import ModuleMap from "../modules/ModuleMap";
import { useMessages } from "../hooks/MessagesHook";
import { isMobile } from "react-device-detect";
import "../../scss/blackout.scss";

export default function Blackout() {
  const { blackout, setBlackout } = useBlackout();
  const { redirect, setRedirect, chosenMess, setIsChose, setChosenMess } = useMessages();

  const [isOpen, setIsOpen] = useState(false);
  const [componentName, setComponenetName] = useState(blackout.module ?? "");
  const blackoutRef = useRef<HTMLDivElement>(null);
  const blackoutBackgroundRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);
  const isClosing = useRef(false);

  const Component = ModuleMap[componentName] ?? null;

  const closeModal = () => {
    setBlackout({ seted: false, module: undefined });
    if (blackout.module !== "RedirectMesses") {
      setRedirect(undefined);
    } else {
      setIsChose(false);
      setChosenMess([]);
      setRedirect(
        redirect?.filter((m) => chosenMess.some((cm) => cm.id === m.id))
      );
    }
  };

  // Анимация закрытия (уезжает вниз)
  const animateClose = () => {
    if (isClosing.current || !moduleRef.current) {
      closeModal();
      return;
    }
    isClosing.current = true;

    const module = moduleRef.current;

    module.style.transition = "none";
    void module.offsetWidth; // force reflow

    module.style.transition = "transform 0.25s ease";

    if (blackoutBackgroundRef.current) {
      blackoutBackgroundRef.current.style.transition = "opacity 0.25s ease";
      blackoutBackgroundRef.current.style.opacity = "0";
    }
    if (blackoutRef.current) {
      blackoutRef.current.style.transition = "backdrop-filter 0.25s ease";
      blackoutRef.current.style.setProperty("--blackout-blur", "0px");
    }

    module.style.transform = "translateY(100%)";

    setTimeout(() => {
      closeModal();
      isClosing.current = false;
    }, 250);
  };

  // Открытие / закрытие компонента
  useEffect(() => {
    if (blackout.seted) {
      setIsOpen(true);
      isClosing.current = false;

      if (blackout.module) {
        setComponenetName(blackout.module);
      } else {
        setTimeout(() => setComponenetName(""), 200);
      }
    } else {
      setTimeout(() => {
        setIsOpen(false);
        setComponenetName("");
      }, 200);
    }
  }, [blackout.module, blackout.seted]);

  // Анимация появления (выезжает снизу) — только на мобилках
  useEffect(() => {
    if (!isOpen || !blackout.seted || !isMobile || isClosing.current) return;

    const module = moduleRef.current;
    const bg = blackoutBackgroundRef.current;
    const blackoutEl = blackoutRef.current;

    if (!module) return;

    // Стартовое положение — полностью снизу
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

    // Force reflow
    void module.offsetWidth;

    // Запускаем анимацию появления
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
      if (module) module.style.transition = "";
      if (bg) bg.style.transition = "";
      if (blackoutEl) blackoutEl.style.transition = "";
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, blackout.seted]);

  // Клик вне модуля
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        blackoutRef.current &&
        moduleRef.current &&
        !moduleRef.current.contains(event.target as Node)
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
  }, [blackout.module]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isClosing.current) return;
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    dragging.current = true;

    if (moduleRef.current) moduleRef.current.style.transition = "none";
    if (blackoutRef.current) blackoutRef.current.style.transition = "none";
    if (blackoutBackgroundRef.current) {
      blackoutBackgroundRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || !moduleRef.current || isClosing.current) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      moduleRef.current.style.transform = `translateY(${diff}px)`;
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
  };

  const handleTouchEnd = () => {
    if (!dragging.current || !moduleRef.current || isClosing.current) return;
    dragging.current = false;

    const diff = currentY.current - startY.current;

    if (diff > 100) {
      animateClose();
    } else {
      moduleRef.current.style.transition = "transform 0.25s ease";
      if (blackoutBackgroundRef.current) {
        blackoutBackgroundRef.current.style.transition = "opacity 0.25s ease";
        blackoutBackgroundRef.current.style.opacity = "1";
      }
      if (blackoutRef.current) {
        blackoutRef.current.style.transition = "backdrop-filter 0.25s ease";
        blackoutRef.current.style.setProperty("--blackout-blur", "12px");
      }
      moduleRef.current.style.transform = "translateY(0)";

      setTimeout(() => {
        if (moduleRef.current) moduleRef.current.style.transition = "";
        if (blackoutRef.current) blackoutRef.current.style.transition = "";
        if (blackoutBackgroundRef.current) {
          blackoutBackgroundRef.current.style.transition = "";
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
      <div
        ref={moduleRef}
        className={`blackoutModule ${blackout.seted ? "open" : "close"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          e.preventDefault();
          if (e.target === e.currentTarget) {
            if (isMobile) {
              animateClose();
            } else {
              closeModal();
            }
          }
        }}
      >
        {isMobile && !blackout.img && <div className="mobileBar" />}
        {Component ? <Component /> : null}
      </div>
    </div>
  );
}