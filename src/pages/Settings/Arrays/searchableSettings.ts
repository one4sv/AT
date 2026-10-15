import { PaintBucketIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { SearchableSetting } from "../Settings";

export interface SearchableSection {
  id: string;
  name: string;
  items: SearchableSetting[];
}

export function useSearchableSettings(): SearchableSection[] {
  const { t } = useTranslation("settings");

  return [
    {
      id: "pers",
      name: t("settings.personalization"),
      items: [
        {
          id: "theme",
          name: t("personalization.theme"),
          desc: t("settings.personalizationDesc"),
          tab: "pers",
          icon: PaintBucketIcon,
          category: t("settings.personalization"),
        },
        {
          id: "accent",
          name: t("personalization.accentColors"),
          desc: t("personalization.mainColor"),
          tab: "pers",
          icon: PaintBucketIcon,
          category: t("settings.personalization"),
        },
        {
          id: "decor",
          name: t("personalization.decor"),
          desc: "Степень размытия, стекло",
          tab: "pers",
          icon: PaintBucketIcon,
          category: t("settings.personalization"),
        },
        {
          id: "bg",
          name: t("personalization.background"),
          desc: t("personalization.addCustom"),
          tab: "pers",
          icon: PaintBucketIcon,
          category: t("settings.personalization"),
        },
        {
          id: "layout",
          name: "Боковое меню",
          desc: "Всегда / По нажатию кнопки",
          tab: "pers",
          icon: PaintBucketIcon,
          category: t("settings.personalization"),
        },
      ],
    },

    // Добавляй остальные секции здесь
  ];
}