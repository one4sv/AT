import type { ElementType } from "react"
import {
  SneakerMove, SoccerBall, Strategy, Volleyball, Hockey, PingPong, Racquet,
  DribbbleLogo, PersonSimpleSwim, PersonSimpleSnowboard, PersonSimpleSki,
  PersonSimpleBike, BowlingBall, BoxingGlove, PersonSimpleWalk, Code
} from "@phosphor-icons/react"
import { Bed } from "lucide-react";

export type Tag = {
  icon: ElementType;
  label: string;
  value: string;
};

export const tags: Tag[] = [
  { icon: Code, label: "Программирование", value: "coding" },
  { icon: Bed, label: "Режим сна", value: "sleep" },
  { icon: PersonSimpleWalk, label: "Шаги в день", value: "walking" },
  { icon: Hockey, label: "Хоккей", value: "hockey" },
  { icon: PersonSimpleBike, label: "Катание на велосипеде", value: "cycling" },
  { icon: PersonSimpleSki, label: "Катание на лыжах", value: "skiing" },
  { icon: PersonSimpleSnowboard, label: "Катание на сноуборде", value: "snowboarding" },
  { icon: PersonSimpleSwim, label: "Плавание", value: "swimming" },
  { icon: PingPong, label: "Настольный теннис", value: "pingpong" },
  { icon: Racquet, label: "Большой теннис", value: "tennis" },
  { icon: BowlingBall, label: "Боулинг", value: "bowling" },
  { icon: BoxingGlove, label: "Бокс", value: "boxing" },
  { icon: DribbbleLogo, label: "Баскетбол", value: "basketball" },
  { icon: SneakerMove, label: "Бег", value: "running" },
  { icon: SoccerBall, label: "Футбол", value: "football" },
  { icon: Strategy, label: "Спортивные игры", value: "games" },
  { icon: Volleyball, label: "Воллейбол", value: "volleyball" },
];
