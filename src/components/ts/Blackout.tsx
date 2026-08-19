import { useEffect, useRef } from "react";
import { useBlackout } from "../hooks/BlackoutHook";
import ModuleMap from "../modules/ModuleMap";
import { useMessages } from "../hooks/MessagesHook";
import { isMobile } from "react-device-detect";
import { XIcon } from "@phosphor-icons/react";
import "../../scss/blackout.scss"

export default function Blackout() {
  const { blackout, setBlackout } = useBlackout();
  const { redirect, setRedirect, chosenMess, setIsChose, setChosenMess } = useMessages();
  const blackoutRef = useRef<HTMLDivElement>(null);
  const blackoutBackgroundRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);

  const Component = blackout.module ? ModuleMap[blackout.module] : null;

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

  // Закрытие по клику вне модалки
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        blackoutRef.current &&
        moduleRef.current &&
        !moduleRef.current.contains(event.target as Node)
      ) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [blackout.module]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    dragging.current = true;

    if (moduleRef.current) {
        moduleRef.current.style.transition = "none";
    }

    if (blackoutRef.current) {
        blackoutRef.current.style.transition = "none";
    }

    if (blackoutBackgroundRef.current) {
        blackoutBackgroundRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!dragging.current || !moduleRef.current) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0) {
          moduleRef.current.style.transform = `translateY(${diff}px)`;

          const progress = Math.min(diff / 400, 1);

          const opacity = 1 - progress * 0.65;
          const blur = 12 - progress * 11.2;

          // Только затемнение
          if (blackoutBackgroundRef.current) {
              blackoutBackgroundRef.current.style.opacity =
                  String(opacity);
          }

          // Только blur
          if (blackoutRef.current) {
              blackoutRef.current.style.setProperty(
                  "--blackout-blur",
                  `${blur}px`
              );
          }
      }
  };

  const handleTouchEnd = () => {
    if (!dragging.current || !moduleRef.current) return;

    dragging.current = false;

    const diff = currentY.current - startY.current;

    if (diff > 100) {
      moduleRef.current.style.transition = "transform 0.25s ease";

      if (blackoutBackgroundRef.current) {
        blackoutBackgroundRef.current.style.transition =
            "opacity 0.25s ease";
        blackoutBackgroundRef.current.style.opacity = "0";
      }

      if (blackoutRef.current) {
        blackoutRef.current.style.transition =
            "backdrop-filter 0.25s ease";
        blackoutRef.current.style.setProperty(
            "--blackout-blur",
            "0px"
        );
      }

      moduleRef.current.style.transform = "translateY(100%)";

      setTimeout(closeModal, 250);
  } else {
      moduleRef.current.style.transition =
          "transform 0.25s ease";

      if (blackoutBackgroundRef.current) {
        blackoutBackgroundRef.current.style.transition =
            "opacity 0.25s ease";
        blackoutBackgroundRef.current.style.opacity = "1";
      }

      if (blackoutRef.current) {
        blackoutRef.current.style.transition =
            "backdrop-filter 0.25s ease";
        blackoutRef.current.style.setProperty(
            "--blackout-blur",
            "12px"
        );
      }

      moduleRef.current.style.transform = "translateY(0)";

      setTimeout(() => {
        if (moduleRef.current) {
            moduleRef.current.style.transition = "";
        }

        if (blackoutRef.current) {
            blackoutRef.current.style.transition = "";
        }

        if (blackoutBackgroundRef.current) {
            blackoutBackgroundRef.current.style.transition = "";
        }
      }, 250);
    }
  };

  if (!blackout.seted || !Component) return null;

  return (
    <div
      className="blackout"
      ref={blackoutRef}
    >
      <div
          ref={blackoutBackgroundRef}
          className="blackoutBackground"
      />
      {blackout.img && (
        <div className="imgPrevCross" onClick={() => setBlackout({seted:false})}>
          <XIcon size={32}/>
        </div>
      )}
      <div
        ref={moduleRef}
        className="blackoutModule"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          e.preventDefault();
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}
      >
        {isMobile && !blackout.img && <div className="mobileBar" />}
        <Component />
      </div>
    </div>
  );
}