export default function getCornerType(id: number, ids: number[], chosenMessIds: number[]) {
    if (!chosenMessIds.includes(id)) return null;

    const index = ids.findIndex(msg => msg === id);

    const prev = ids[index - 1];
    const next = ids[index + 1];

    const prevChosen = prev && chosenMessIds.includes(prev);
    const nextChosen = next && chosenMessIds.includes(next);

    if (!prevChosen && !nextChosen) return "single"; // одинокое выделенное сообщение
    if (!prevChosen && nextChosen) return "first";  // начало выделенной цепочки
    if (prevChosen && !nextChosen) return "last";   // конец выделенной цепочки
    if (prevChosen && nextChosen) return "middle";  // внутренняя часть выделенной цепочки
    return null;
}