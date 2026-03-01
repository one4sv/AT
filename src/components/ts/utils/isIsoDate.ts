export const isIsoDate = (s: string | undefined): boolean => {
    if (!s) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(s)) return false;
    const date = new Date(s);
    return !isNaN(date.getTime());
};