export type EmojiGroup = {
  group: string,
  value: string
}

export type Emoji = {
  pic: string,
  group: string
}

export const EmojiesGroups: EmojiGroup[] = [
  { group: "faces", value: "Эмоции" },
  { group: "hands", value: "Жесты" },
  { group: "animals", value: "Животные" },
  { group: "food", value: "Еда" },
  { group: "objects", value: "Предметы" },
  { group: "symbols", value: "Символы" },
  { group: "nature", value: "Природа" },
  { group: "transport", value: "Транспорт" },
];

export const Emojies: Emoji[] = [
  // ✋ Жесты
  { pic: "👍", group: "hands" },
  { pic: "👎", group: "hands" },
  { pic: "👏", group: "hands" },
  { pic: "🙌", group: "hands" },
  { pic: "🤝", group: "hands" },
  { pic: "✌️", group: "hands" },
  { pic: "🤞", group: "hands" },
  { pic: "👌", group: "hands" },
  { pic: "🤙", group: "hands" },
  { pic: "👋", group: "hands" },
  { pic: "🫶", group: "hands" },
  { pic: "🙏", group: "hands" },

  // 😊 Эмоции
  { pic: "😀", group: "faces" },
  { pic: "😁", group: "faces" },
  { pic: "😂", group: "faces" },
  { pic: "🤣", group: "faces" },
  { pic: "😅", group: "faces" },
  { pic: "😊", group: "faces" },
  { pic: "😍", group: "faces" },
  { pic: "😘", group: "faces" },
  { pic: "😎", group: "faces" },
  { pic: "🤩", group: "faces" },
  { pic: "😢", group: "faces" },
  { pic: "😭", group: "faces" },
  { pic: "😡", group: "faces" },
  { pic: "😱", group: "faces" },
  { pic: "🤔", group: "faces" },
  { pic: "😴", group: "faces" },
  { pic: "🤯", group: "faces" },
  { pic: "🥱", group: "faces" },
  { pic: "🤪", group: "faces" },

  // 🐻 Животные
  { pic: "🐶", group: "animals" },
  { pic: "🐱", group: "animals" },
  { pic: "🐭", group: "animals" },
  { pic: "🐹", group: "animals" },
  { pic: "🐰", group: "animals" },
  { pic: "🦊", group: "animals" },
  { pic: "🐻", group: "animals" },
  { pic: "🐼", group: "animals" },
  { pic: "🐨", group: "animals" },
  { pic: "🐸", group: "animals" },
  { pic: "🐔", group: "animals" },
  { pic: "🐧", group: "animals" },
  { pic: "🐢", group: "animals" },
  { pic: "🐍", group: "animals" },
  { pic: "🦋", group: "animals" },

  // 🌳 Природа
  { pic: "🌸", group: "nature" },
  { pic: "🌞", group: "nature" },
  { pic: "🌧️", group: "nature" },
  { pic: "🌈", group: "nature" },
  { pic: "🔥", group: "nature" },
  { pic: "❄️", group: "nature" },
  { pic: "🌊", group: "nature" },
  { pic: "🌵", group: "nature" },

  // 🍕 Еда
  { pic: "🍏", group: "food" },
  { pic: "🍎", group: "food" },
  { pic: "🍌", group: "food" },
  { pic: "🍓", group: "food" },
  { pic: "🍒", group: "food" },
  { pic: "🥝", group: "food" },
  { pic: "🍇", group: "food" },
  { pic: "🥑", group: "food" },
  { pic: "🍕", group: "food" },
  { pic: "🍔", group: "food" },
  { pic: "🍟", group: "food" },
  { pic: "🌭", group: "food" },
  { pic: "🍣", group: "food" },
  { pic: "🍰", group: "food" },
  { pic: "☕", group: "food" },
  { pic: "🍺", group: "food" },

  // 🚗 Транспорт
  { pic: "🚗", group: "transport" },
  { pic: "🚕", group: "transport" },
  { pic: "🚙", group: "transport" },
  { pic: "🚌", group: "transport" },
  { pic: "🚎", group: "transport" },
  { pic: "🚲", group: "transport" },
  { pic: "🏍️", group: "transport" },
  { pic: "✈️", group: "transport" },
  { pic: "🚀", group: "transport" },
  { pic: "🚢", group: "transport" },

  // 💡 Предметы
  { pic: "💡", group: "objects" },
  { pic: "📱", group: "objects" },
  { pic: "💻", group: "objects" },
  { pic: "⌚", group: "objects" },
  { pic: "🎧", group: "objects" },
  { pic: "📷", group: "objects" },
  { pic: "🎮", group: "objects" },
  { pic: "🎁", group: "objects" },
  { pic: "💬", group: "objects" },
  { pic: "🔑", group: "objects" },
  { pic: "🕹️", group: "objects" },

  // 🔣 Символы
  { pic: "❤️", group: "symbols" },
  { pic: "💔", group: "symbols" },
  { pic: "💯", group: "symbols" },
  { pic: "✨", group: "symbols" },
  { pic: "⭐", group: "symbols" },
  { pic: "⚡", group: "symbols" },
  { pic: "💥", group: "symbols" },
  { pic: "🎉", group: "symbols" },
  { pic: "🔔", group: "symbols" },
  { pic: "💤", group: "symbols" },
];
