import { useEffect, useRef } from "react";
import { useBlackout } from "../hooks/BlackoutHook";
import ModuleMap from "../modules/ModuleMap";
import { useMessages } from "../hooks/MessagesHook";
import { isMobile } from "react-device-detect";

export default function Blackout() {
  const { blackout, setBlackout } = useBlackout();
  const { redirect, setRedirect, chosenMess, setIsChose, setChosenMess } = useMessages();
  const blackoutRef = useRef<HTMLDivElement>(null);
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

  // ——— Свайп вниз ———
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    dragging.current = true;

    if (moduleRef.current) {
      moduleRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || !moduleRef.current) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // Только вниз
    if (diff > 0) {
      moduleRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!dragging.current || !moduleRef.current) return;
    dragging.current = false;

    const diff = currentY.current - startY.current;

    if (diff > 100) {
      // Закрываем
      moduleRef.current.style.transition = "transform 0.25s ease";
      moduleRef.current.style.transform = "translateY(100%)";
      setTimeout(closeModal, 250);
    } else {
      // Возвращаем на место
      moduleRef.current.style.transition = "transform 0.25s ease";
      moduleRef.current.style.transform = "translateY(0)";

      setTimeout(() => {
        if (moduleRef.current) {
          moduleRef.current.style.transition = "";
        }
      }, 250);
    }
  };

  if (!blackout.seted || !Component) return null;

  return (
    <div
      className="blackout"
    >
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