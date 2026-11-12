import { dateInAppZone } from "../../../../components/ts/utils/dateToStr";

export const isSameDay = (a: Date, b: Date) => dateInAppZone(a) === dateInAppZone(b);
