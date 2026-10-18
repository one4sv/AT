import {
  BellRingingIcon,
  ChatsTeardropIcon,
  LockKeyIcon,
  PaintBucketIcon,
  ShieldCheckIcon,
  SneakerMoveIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import type { Setting } from "../Settings";
import { useTranslation } from "react-i18next";

export function useSettingsTabs(): Setting[] {
  const { t } = useTranslation("settings");

  return [
    {
      name: t("settings.general"),
      tab: "gen",
      desc: t("settings.generalDesc"),
      icon: WrenchIcon,
    },
    {
      name: t("settings.personalization"),
      tab: "pers",
      desc: t("settings.personalizationDesc"),
      icon: PaintBucketIcon,
    },
    {
      name: t("settings.activities"),
      tab: "activities",
      desc: t("settings.activitiesDesc"),
      icon: SneakerMoveIcon,
    },
    {
      name: t("settings.chats"),
      tab: "chats",
      desc: t("settings.chatsDesc"),
      icon: ChatsTeardropIcon,
    },
    {
      name: t("settings.notifications"),
      tab: "notes",
      desc: t("settings.notificationsDesc"),
      icon: BellRingingIcon,
    },
    {
      name: t("settings.security"),
      tab: "security",
      desc: t("settings.securityDesc"),
      icon: ShieldCheckIcon,
    },
    {
      name: t("settings.privacy"),
      tab: "privacy",
      desc: t("settings.privacyDesc"),
      icon: LockKeyIcon,
    },
  ];
}