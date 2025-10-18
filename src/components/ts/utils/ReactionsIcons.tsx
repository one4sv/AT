import { Heart } from "@phosphor-icons/react"; // <- обязательно импорт
import type { ReactElement } from "react";

export const reactionIcons: Record<string, ReactElement> = {
  Heart: <Heart weight="fill" color="#d60000"/>,
};
