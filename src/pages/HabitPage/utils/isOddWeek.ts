export const isOddWeek = (weekStart:string | null, date:Date) => {
    if (!weekStart) return true;

    const start = new Date(weekStart);
    const target = new Date(date);
    
    start.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const getMonday = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const startMonday = getMonday(start);
    const targetMonday = getMonday(target);

    const diffDays = Math.floor(
        (targetMonday.getTime() - startMonday.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.floor(diffDays / 7);

    return weekNumber % 2 === 0;
};