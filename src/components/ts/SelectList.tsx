import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { GroupType } from "./chern/GroupsHabitContext";

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
  showOnly
}: {
  placeholder?: string;
  className: string;
  chevron?: boolean;
  arr: Option[] | GroupType[];
  hide?: boolean;
  prop?: React.Dispatch<React.SetStateAction<string | number | undefined >>;
  readOnly?: boolean;
  extraFunction?: (value:string) => void;
  id?:string;
  selected?: string | number| undefined;
  showOnly?: boolean | undefined
}) {
  const [showList, setShowList] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  const listRef = useRef<HTMLDivElement>(null);

  if (hide === undefined) hide = true
  if (chevron === undefined) chevron = true
  if (readOnly === undefined) readOnly = true
  if (showOnly === undefined) showOnly = false

  useEffect(() => {
    if (selected !== undefined) {
      const idx = arr.findIndex(o => o.value === selected)
      setSelectedLabel(arr[idx].label);
      if (prop)
      prop(prev => {
        if (prev !== arr[idx].value) {
          return arr[idx].value;
        }
        return prev;
      });
    }
  }, [arr, prop, selected]);

  const handleSelect = (option: Option) => {
    if (option.value !== "0") setSelectedLabel(option.label);
    setShowList(false);
    if (prop) prop(option.value);
    if (extraFunction) extraFunction(option.value);
  };

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        listRef.current &&
        hide &&
        showList &&
        !listRef.current.contains(event.target as Node)
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
    <div className={`selectListDiv ${className}`}>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        onClick={() => setShowList(!showList)}
        value={selectedLabel}
        readOnly={readOnly}
      />
      {chevron && (
        <ChevronDown style={{ transform: `rotate(${showList ? "180deg" : "0deg"})`, transition: "transform 0.2s" }}/>
      )}
      <div className={`selectList ${showList ? "active" : ""}`} ref={listRef}>
        {showList &&
          arr &&
          !showOnly &&
          arr.map((option:Option | GroupType, idx) => {
            const Icon = option?.icon
            return (
              <div
                className="selectListButt"
                key={idx}
                onClick={() => handleSelect(option)}
              >
                {option.icon ? 
                  (
                    <Icon color={option.color}/>
                  ) : ('')
                }
                {option.label}
              </div>
            )
          }
          )}
      </div>
    </div>
  );
}