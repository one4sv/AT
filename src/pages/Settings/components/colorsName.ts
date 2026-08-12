export const colorsName = (accent: string, grad: string): string => {
    const colors = [
        // Зелённый
        {
            label: "Свежевыжитый яд",
            accent: "poison",
            grad: "meadow"
        },        
        {
            label: "Кислотный осадок",
            accent: "poison",
            grad: "violet"
        },
        {
            label: "Критическая масса",
            accent: "poison",
            grad: "rubin"
        },        
        {
            label: "Криогенный реагент",
            accent: "poison",
            grad: "ocean"
        },
        {
            label: "Окислившаяся медь",
            accent: "poison",
            grad: "ginger"
        },
        {
            label: "Чистый образец",
            accent: "poison",
            grad: "mono"
        },        
        {
            label: "Кристаллизованный токсин",
            accent: "poison",
            grad: "void"
        },
        // Фиолетовый
        {
            label: "Колыбель звёзд",
            accent: "space",
            grad: "violet"
        },        
        {
            label: "Чужеродная планета",
            accent: "space",
            grad: "meadow"
        },        
        {
            label: "Туманность Андромеды",
            accent: "space",
            grad: "rubin"
        },
        {
            label: "Столпы Творения",
            accent: "space",
            grad: "ginger"
        },        
        {
            label: "Сверхновая звезда",
            accent: "space",
            grad: "ocean"
        },
        {
            label: "Космическая даль",
            accent: "space",
            grad: "void"
        },        
        {
            label: "Млечный путь",
            accent: "space",
            grad: "mono"
        },
        // Красный
        {
            label: "Карамельное яблоко",
            accent: "apple",
            grad: "rubin"
        },          
        {
            label: "Арбузный леденец",
            accent: "apple",
            grad: "meadow"
        },             
        {
            label: "Малиновый джем",
            accent: "apple",
            grad: "ginger"
        },        
        {
            label: "Сладкая вата",
            accent: "apple",
            grad: "violet"
        },              
        {
            label: "Клубничное мороженое",
            accent: "apple",
            grad: "ocean"
        },                   
        {
            label: "Глазированная вишня",
            accent: "apple",
            grad: "void"
        },        
        {
            label: "Алый бархат",
            accent: "apple",
            grad: "mono"
        },
        // Синий
        {
            label: "Безоблачный день",
            accent: "sky",
            grad: "ocean"
        },        
        {
            label: "Выпавшая роса",
            accent: "sky",
            grad: "meadow"
        },        
        {
            label: "Северное сияние",
            accent: "sky",
            grad: "violet"
        },        
        {
            label: "Утренняя заря",
            accent: "sky",
            grad: "rubin"
        },
        {
            label: "Пушистые облака",
            accent: "sky",
            grad: "mono"
        },        
        {
            label: "Полярная ночь",
            accent: "sky",
            grad: "void"
        },        
        {
            label: "Закатное небо",
            accent: "sky",
            grad: "ginger"
        },
        // Ораньжевый
        {
            label: "Открытый огонь",
            accent: "orange",
            grad: "ginger"
        },        
        {
            label: "Химическое пламя",
            accent: "orange",
            grad: "meadow"
        },           
         {
            label: "Раскалённая плазма",
            accent: "orange",
            grad: "violet"
        },               
        {
            label: "Закалённая сталь",
            accent: "orange",
            grad: "ocean"
        },          
        {
            label: "Жидкий металл",
            accent: "orange",
            grad: "rubin"
        },        
        {
            label: "Сплав бронзы",
            accent: "orange",
            grad: "void"
        },        
        {
            label: "Плавление стекла",
            accent: "orange",
            grad: "mono"
        },
        // Инвертированный
        {
            label: "Молочная дымка",
            accent: "inversion",
            grad: "mono"
        },        
        {
            label: "Росистый луг",
            accent: "inversion",
            grad: "meadow"
        },           
        {
            label: "Цветущая серень",
            accent: "inversion",
            grad: "violet"
        },        
        {
            label: "Нежная сакура",
            accent: "inversion",
            grad: "rubin"
        },
        {
            label: "Замёрзшее озеро",
            accent: "inversion",
            grad: "ocean"
        },        
        {
            label: "Солнечные блики",
            accent: "inversion",
            grad: "ginger"
        },
        {
            label:"Туман после дождя",
            accent: "inversion",
            grad: "void"
        },
        // Чёрный
        {
            label: "Темнейшая бездна",
            accent: "abyss",
            grad: "void"
        },
        {
            label: "Лунное серебро",
            accent: "abyss",
            grad: "mono"
        },        
        {
            label: "Полуночная мгла",
            accent: "abyss",
            grad: "ocean"
        },        
        {
            label: "Вулканический пепел",
            accent: "abyss",
            grad: "rubin"
        },       
        {
            label: "Зловещий леший",
            accent: "abyss",
            grad: "meadow"
        },       
        {
            label: "Тлеющие угли",
            accent: "abyss",
            grad: "ginger"
        },        
        {
            label: "Сумеречная пустота",
            accent: "abyss",
            grad: "violet"
        },
    ];

    return colors.find(
        el => el.accent === accent && el.grad === grad
    )?.label || "Безымянная тема";
};