export type SlideData = {
    month: number;
    year: number;
    days: {
        prev: Array<{ day: number; month: number; year: number }>;
        this: Array<{ day: number; month: number; year: number }>;
        post: Array<{ day: number; month: number; year: number }>;
    };
};

export const buildSlide = (monthNum: number, yearNum: number): SlideData => {
    const firstDay = new Date(yearNum, monthNum, 1).getDay()
    const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate()

    const startOffset = (firstDay + 6) % 7

    const prev: SlideData["days"]["prev"] = []
    for (let i = 0; i < startOffset; i++) {
        const d = new Date(yearNum, monthNum, -startOffset + i + 1)
        prev.push({
            day: d.getDate(),
            month: d.getMonth(),
            year: d.getFullYear()
        })
    }

    const thisMonth: SlideData["days"]["this"] = []
    for (let i = 1; i <= daysInMonth; i++) {
        thisMonth.push({
            day: i,
            month: monthNum,
            year: yearNum
        })
    }

    const total = prev.length + thisMonth.length
    const endOffset = (7 - (total % 7)) % 7

    const post: SlideData["days"]["post"] = []
    for (let i = 0; i < endOffset; i++) {
        const d = new Date(yearNum, monthNum + 1, i + 1)
        post.push({
            day: d.getDate(),
            month: d.getMonth(),
            year: d.getFullYear()
        })
    }

    return {
        month: monthNum,
        year: yearNum,
        days: {
            prev,
            this: thisMonth,
            post
        }
    }
}