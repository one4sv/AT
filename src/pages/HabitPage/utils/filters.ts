export const periods = [
    { label:"30 дней", value:"thirty" },
    { label:"7 дней", value:"week" },
    { label:"90 дней", value:"ninety" },
    { label:"365 дней", value:"year" },
    { label:"всё время", value:"all" }
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
export const cards = [
    {
        value:"comp",
        label:"Выполнения",
        props:[
            {
                label: "Выполнено", value:"comp", props:[
                    {label:"Дней", value:"compCount"},
                    {label:"В процнтах", value:"compProcent"}
                ]
            },
            {
                label: "Пропущено", value:"skip", props:[
                    {label:"Дней", value:"skipCount"},
                    {label:"В процентах", value:"skipProcent"}
                ]
            },
        ],
    },        
    {
        value:"streak",
        label:"Стрики",
        props:[
            {
                label: "Стрик (3+ дней подряд)", value:"streak", props:[
                    {label:"Дней", value:"streakCount"},
                    {label:"Максмальный", value:"streakMax"},
                    {label:"В среднем", value:"streakMiddle"}
                ]
            },
        ],
    },
    {
        value:"break",
        label:"Перерывы",
        props: [
            {
                label: "Перерывы", value:"break", props:[
                    {label:"Максимальный",value:"breakMax"},
                    {label: "В среднем", value: "breakMiddle"}
                ]
            }
        ]
    },
    {
        value: "all",
        label: "Всего",
        props: [
            {
                label: "Всего дней в трекинге", value:"all", props:[
                    {label:"Дней в трекинге", value:"allCount"}
                ]
            },
        ]
    },
    {
        value: "counter",
        label: "Счётчик",
        props: [
            {
                label: "Счётчик", value:"counter", props:[
                    {label:"Всего", value:"fullCounter"},
                    {label:"Максимальный", value:"maxCounter"},
                    {label:"Средний", value:"middleCounter"},
                ]
            },
        ]
    },
    {
        value: "timer",
        label: "Таймер",
        props: [
            {
                label: "Таймер", value:"timer", props:[
                    {label:"Всего", value:"fullTimer"},
                    {label:"Максимальный", value:"maxTimer"},
                    {label:"Средний", value:"middleTimer"},
                ]
            },
        ]
    },
    {
        value: "schedule",
        label: "Расписание",
        props: [
            {
                label: "Расписание", value:"schedules", props:[
                    {label:"Всего", value:"fullSchedule"},
                    {label:"Максимальный", value:"maxSchedule"},
                    {label:"Средний", value:"middleSchedule"},
                ]
            },
        ]
    }
] 
