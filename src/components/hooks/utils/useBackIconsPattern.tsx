import { useMemo } from "react";
import type { JSX } from "react";
import { backPattern } from "../../ts/utils/backPattern";

interface BackIconsPatternOptions {
    width?: number;
    height?: number;
    minSize?: number;
    maxSize?: number;
}

export function useBackIconsPattern({
    width = window.innerWidth,
    height = window.innerHeight,
    minSize = 40,
    maxSize = 120,
}: BackIconsPatternOptions = {}) {
  return useMemo(() => {
    
    const items: JSX.Element[] = [];

    const rowHeight = minSize;
    let y = 0;

    while (y < height) {
      let x = 0;

      while (x < width) {
        const Icon =
          backPattern[Math.floor(Math.random() * backPattern.length)];
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = 0.1 + Math.random() * 0.1;
        const rotation = Math.random() * 360;

        items.push(
          <div
            key={`${x}-${y}-${items.length}`}
            style={{
              position: "absolute",
              top: y,
              left: x,
              width: size,
              height: size,
              fontSize: size * 0.8,
              opacity,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <Icon weight="thin" />
          </div>
        );

        x += size;
      }

      y += rowHeight;
    }

    return items;
  }, [height, maxSize, minSize, width]);
}