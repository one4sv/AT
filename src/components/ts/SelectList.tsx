import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import "../../scss/SelectList.scss";

export type Option = {
  label: string;
  value: string;
};

export default function SelectList({
  placeholder,
  className,
  chevron,
  arr,
  hide,
  prop,
  readOnly,
  extraFunction,
  selected,
  id,
  showOnly,
  showSelected,
  onChange
}: {
  placeholder?: string;
  className: string;
  chevron?: boolean;
  arr: Option[];
  hide?: boolean;
  prop?: React.Dispatch<React.SetStateAction<string | number | undefined >>;
  readOnly?: boolean;
  extraFunction?: (value:string) => void;
  id?:string;
  selected?: string | number | undefined;
  showOnly?: boolean | undefined;
  showSelected?:boolean;
  onChange?: (value: string) => void;
}) {
  const [showList, setShowList] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [placement, setPlacement] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  if (hide === undefined) hide = true
  if (chevron === undefined) chevron = true
  if (readOnly === undefined) readOnly = true
  if (showOnly === undefined) showOnly = false
  if (showSelected === undefined) showSelected = true

  useEffect(() => {
    if (selected !== undefined) {
      const idx = arr.findIndex(o => o.value === selected)

      if (idx !== -1) {
        setSelectedLabel(arr[idx].label);

        if (prop)
          prop(prev => {
            if (prev !== arr[idx].value) {
              return arr[idx].value;
            }
            return prev;
          });
      }
    }
  }, [arr, prop, selected]);

  useLayoutEffect(() => {
    if (!showList || showOnly) return;
    const root = rootRef.current;
    const list = listRef.current;
    if (!root || !list) return;

    const updatePlacement = () => {
      // Read the original CSS height limit before applying a viewport cap.
      list.style.maxHeight = "";
      const cssMaxHeight = parseFloat(getComputedStyle(list).maxHeight);
      const desiredHeight = Math.min(list.scrollHeight, Number.isFinite(cssMaxHeight) ? cssMaxHeight : list.scrollHeight);
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      const rect = root.getBoundingClientRect();
      setPlacement(previous => previous.top === rect.top && previous.left === rect.left &&
        previous.width === rect.width && previous.height === rect.height ? previous :
        { top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      // Fixed PageBottom actions (for example Settings search) reserve usable
      // screen space even though they do not shorten visualViewport.height.
      let usableBottom = viewportBottom;
      root.closest(".settingsPage, .page-content")?.querySelectorAll<HTMLElement>(".pageBottom").forEach(bar => {
        const bounds = bar.getBoundingClientRect();
        if (bounds.width > 0 && bounds.height > 0 && bounds.top >= rect.bottom &&
            bounds.left < rect.right && bounds.right > rect.left) {
          usableBottom = Math.min(usableBottom, bounds.top);
        }
      });
      const spaceBelow = Math.max(0, usableBottom - rect.bottom - 12);
      const spaceAbove = Math.max(0, rect.top - viewportTop - 12);
      const upwards = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
      list.style.maxHeight = Math.max(0, Math.min(desiredHeight, upwards ? spaceAbove : spaceBelow)) + "px";
      setOpenUp(previous => previous === upwards ? previous : upwards);
    };

    updatePlacement();
    const handleScroll = (event: Event) => {
      if (!list.contains(event.target as Node)) updatePlacement();
    };
    const observer = new ResizeObserver(updatePlacement);
    observer.observe(root);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", handleScroll, true);
    window.visualViewport?.addEventListener("resize", updatePlacement);
    window.visualViewport?.addEventListener("scroll", updatePlacement);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", handleScroll, true);
      window.visualViewport?.removeEventListener("resize", updatePlacement);
      window.visualViewport?.removeEventListener("scroll", updatePlacement);
      list.style.maxHeight = "";
    };
  }, [showList, showOnly, arr.length, showSelected, selected]);

  const handleSelect = (option: Option) => {
    if (option.value !== "0") setSelectedLabel(option.label);
    setShowList(false);
    if (prop) prop(option.value);
    if (extraFunction) extraFunction(option.value);
    onChange?.(option.value);
  };

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        rootRef.current &&
        hide &&
        showList &&
        !rootRef.current.contains(event.target as Node) &&
        !portalRef.current?.contains(event.target as Node)
      ) {
        setShowList(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [hide, showList]);

  return (
    <div ref={rootRef} className={`selectListDiv ${className} ${showOnly && "showOnly"} ${showList && "isOpen"} ${openUp && "openUp"}`}>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        onClick={() => !showOnly && setShowList(!showList)}
        value={selectedLabel}
        readOnly={readOnly}
      />
      {chevron && (
        <ChevronDown style={{ transform: `translateY(-50%) rotate(${showList && !showOnly ? "180deg" : "0deg"})`, transition: "transform 0.2s" }}/>
      )}
      {showList && !showOnly && createPortal(
        <div
          ref={portalRef}
          className={`selectListDiv selectListPortalRoot ${className} isOpen ${openUp ? "openUp" : ""}`}
          style={{ top: placement.top, left: placement.left, width: placement.width, height: placement.height }}
          onMouseDown={event => event.stopPropagation()}
        >
          <div className="selectList active" ref={listRef}>
            {arr.filter(option => showSelected || option.value !== selected).map((option: Option, idx) => (
              <div
                className="selectListButt"
                key={idx}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}