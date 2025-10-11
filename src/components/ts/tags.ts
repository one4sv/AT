import type { ElementType } from "react"
import {
  SneakerMove, SoccerBall, Strategy, Volleyball, Hockey, PingPong, Racquet,
  DribbbleLogo, PersonSimpleSwim, PersonSimpleSnowboard, PersonSimpleSki,
  PersonSimpleBike, BowlingBall, BoxingGlove, PersonSimpleWalk, Code,
  BookBookmark, Briefcase, Palette, Camera, Guitar
} from "@phosphor-icons/react"
import { Bed } from "lucide-react";
import { DiceFive, GameController } from "@phosphor-icons/react/dist/ssr";

export type GroupsType = {
  group:string
  value:string
}
export type Tag = {
  icon: ElementType;
  label: string;
  value: string;
  group:string;
};

export const tags: Tag[] = [
  { icon: Code, label: "Программирование", value: "coding", group:"hobby" },
  { icon: Palette , label: "Рисование", value: "paint", group:"hobby" },
  { icon: Camera , label: "Фотографирование", value: "photo", group:"hobby" },
  { icon: Guitar , label: "Музыка", value: "music", group:"hobby" },
  { icon: GameController , label: "Видеоигры", value: "games", group:"hobby" },
  { icon: DiceFive , label: "Настольные игры", value: "dice", group:"hobby" },

  { icon: Bed, label: "Режим сна", value: "sleep", group:"health" },
  { icon: PersonSimpleWalk, label: "Шаги в день", value: "walking", group:"health" },

  { icon: Hockey, label: "Хоккей", value: "hockey", group:"sport" },
  { icon: PersonSimpleBike, label: "Катание на велосипеде", value: "cycling", group:"sport" },
  { icon: PersonSimpleSki, label: "Катание на лыжах", value: "skiing", group:"sport" },
  { icon: PersonSimpleSnowboard, label: "Катание на сноуборде", value: "snowboarding", group:"sport"},
  { icon: PersonSimpleSwim, label: "Плавание", value: "swimming", group:"sport" },
  { icon: PingPong, label: "Настольный теннис", value: "pingpong", group:"sport"},
  { icon: Racquet, label: "Большой теннис", value: "tennis", group:"sport" },
  { icon: BowlingBall, label: "Боулинг", value: "bowling", group:"sport" },
  { icon: BoxingGlove, label: "Бокс", value: "boxing", group:"sport" },
  { icon: DribbbleLogo, label: "Баскетбол", value: "basketball", group:"sport" },
  { icon: SneakerMove, label: "Бег", value: "running", group:"sport" },
  { icon: SoccerBall, label: "Футбол", value: "football", group:"sport" },
  { icon: Strategy, label: "Спортивные игры", value: "games", group:"sport" },
  { icon: Volleyball, label: "Волейбол", value: "volleyball", group:"sport" },

  { icon: BookBookmark, label: "Учёба", value: "study", group:"maintime" },
  { icon: Briefcase , label: "Работа", value: "work", group:"maintime" },
];

export const groups:GroupsType[] = [
  {group:"hobby", value:"Хобби"},
  {group:"health", value:"Здоровье"},
  {group:"maintime", value:"Занятость"},
  {group:"sport", value:"Спорт"},
]