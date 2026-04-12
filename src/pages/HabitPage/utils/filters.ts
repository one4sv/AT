export const periods = [
    { label:"30 дней", value:"thirty" },
    { label:"7 дней", value:"week" },
    { label:"90 дней", value:"ninety" },
    { label:"365 дней", value:"year" },
    { label:"всё время", value:"all" }
]
export const views = [
    {label:"линейная", value:"line"},
    {label:"столбчатая", value:"column"},
    {label:"круговая", value:"circle"},
]
export const metricsWid = [
    { label:"выполнения", value:"comp"},
    { label:"все", value:"all"},
    { label:"пропуски", value:"skip"},
    { label:"свободно", value:"free"},
]
export const metrics = [
    { label:"выполнения", value:"comp"},
    { label:"все", value:"all"},
    { label:"пропуски", value:"skip"},
]
export const groups = [
    { label:"по дням", value:"day"},
    { label:"по неделям", value:"week"},
    { label:"по месяцам", value:"month"},
]
export const slides = [
    {label: "Прогресс", value:"comp"},
    {label: "Общая", value:"overall"},
    {label: "Стрик", value:"streak"},
    {label: "Повторения", value:"count"},
]
export const overall = [
    {label: "Выполнено", value:"comp", props:["Кол-во", "В процнтах"]},
    {label: "Пропущено", value:"skip", props:["Кол-во", "В процентах"]},
    {label: "Стрик (3+ выполненных дней подряд)", value:"streak", props:["Лучший"]},
    {label: "Перерыв", value:"break", props:["Наибольший"]},
    {label: "Средний стрик", value:"midd", props:["В среднем", "Средний перерыв"]},
    {label: "Всего", value:"alls", props:["Дней в трекинге", "Стриков"]},
    
]
