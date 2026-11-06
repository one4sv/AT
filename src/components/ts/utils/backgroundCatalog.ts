export const MAX_CUSTOM_BACKGROUNDS = 5;

export const backgroundGroups = [
    { id: "essential", items: [
        { id: "landing", labelKey: "personalization.landingBackground" },
        { id: "default", labelKey: "personalization.contourShapes" },
        { id: "art", labelKey: "backgroundLibrary.art" },
        { id: "color", labelKey: "personalization.solidColor" },
        { id: "logo", labelKey: "backgroundLibrary.logo" }
    ] },
    { id: "atmospheric", items: [
        { id: "aurora", labelKey: "backgroundLibrary.aurora" },
        { id: "nebula", labelKey: "backgroundLibrary.nebula" },
        { id: "sunset", labelKey: "backgroundLibrary.sunset" },
        { id: "waves", labelKey: "backgroundLibrary.waves" },
        { id: "petals", labelKey: "backgroundLibrary.petals" }
    ] },
    { id: "retro", items: [
        { id: "retroDrive", labelKey: "backgroundLibrary.retroDrive" },
        { id: "neonCity", labelKey: "backgroundLibrary.neonCity" },
        { id: "laser", labelKey: "backgroundLibrary.laser" },
        { id: "orbit", labelKey: "backgroundLibrary.orbit" },
        { id: "glitch", labelKey: "backgroundLibrary.glitch" }
    ] },
    { id: "abstract", items: [
        { id: "paintSplash", labelKey: "backgroundLibrary.paintSplash" },
        { id: "liquid", labelKey: "backgroundLibrary.liquid" },
        { id: "prism", labelKey: "backgroundLibrary.prism" },
        { id: "abstractSilk", labelKey: "backgroundLibrary.abstractSilk" },
        { id: "abstractGlass", labelKey: "backgroundLibrary.abstractGlass" }
    ] },
    { id: "japanese", items: [
        { id: "japaneseNinja", labelKey: "backgroundLibrary.japaneseNinja" },
        { id: "japaneseSakura", labelKey: "backgroundLibrary.japaneseSakura" },
        { id: "japaneseAlley", labelKey: "backgroundLibrary.japaneseAlley" },
        { id: "japaneseTorii", labelKey: "backgroundLibrary.japaneseTorii" },
        { id: "japaneseGarden", labelKey: "backgroundLibrary.japaneseGarden" }
    ] },
    { id: "greek", items: [
        { id: "greekStatue", labelKey: "backgroundLibrary.greekStatue" },
        { id: "greekTemple", labelKey: "backgroundLibrary.greekTemple" },
        { id: "greekGladiator", labelKey: "backgroundLibrary.greekGladiator" },
        { id: "greekColumns", labelKey: "backgroundLibrary.greekColumns" },
        { id: "greekRuins", labelKey: "backgroundLibrary.greekRuins" }
    ] },
    { id: "myth", items: [
        { id: "mythOlympus", labelKey: "backgroundLibrary.mythOlympus" },
        { id: "mythDragon", labelKey: "backgroundLibrary.mythDragon" },
        { id: "mythTree", labelKey: "backgroundLibrary.mythTree" },
        { id: "mythUnderworld", labelKey: "backgroundLibrary.mythUnderworld" },
        { id: "mythPegasus", labelKey: "backgroundLibrary.mythPegasus" }
    ] },
    { id: "modern", items: [
        { id: "modernParis", labelKey: "backgroundLibrary.modernParis" },
        { id: "modernDubai", labelKey: "backgroundLibrary.modernDubai" },
        { id: "modernSingapore", labelKey: "backgroundLibrary.modernSingapore" },
        { id: "modernTokyo", labelKey: "backgroundLibrary.modernTokyo" },
        { id: "modernNewYork", labelKey: "backgroundLibrary.modernNewYork" }
    ] },
    { id: "ocean", items: [
        { id: "oceanWhale", labelKey: "backgroundLibrary.oceanWhale" },
        { id: "oceanAtlantis", labelKey: "backgroundLibrary.oceanAtlantis" },
        { id: "oceanJellyfish", labelKey: "backgroundLibrary.oceanJellyfish" },
        { id: "oceanReef", labelKey: "backgroundLibrary.oceanReef" },
        { id: "oceanDeep", labelKey: "backgroundLibrary.oceanDeep" }
    ] },
    { id: "gothic", items: [
        { id: "gothicCastle", labelKey: "backgroundLibrary.gothicCastle" },
        { id: "gothicCathedral", labelKey: "backgroundLibrary.gothicCathedral" },
        { id: "gothicLibrary", labelKey: "backgroundLibrary.gothicLibrary" },
        { id: "gothicTower", labelKey: "backgroundLibrary.gothicTower" },
        { id: "gothicGarden", labelKey: "backgroundLibrary.gothicGarden" }
    ] },
    { id: "element", items: [
        { id: "elementVolcano", labelKey: "backgroundLibrary.elementVolcano" },
        { id: "elementStorm", labelKey: "backgroundLibrary.elementStorm" },
        { id: "elementSnow", labelKey: "backgroundLibrary.elementSnow" },
        { id: "elementDesert", labelKey: "backgroundLibrary.elementDesert" },
        { id: "elementWaterfall", labelKey: "backgroundLibrary.elementWaterfall" }
    ] },
    { id: "neon", items: [
        { id: "neonStreet", labelKey: "backgroundLibrary.neonStreet" },
        { id: "neonHighway", labelKey: "backgroundLibrary.neonHighway" },
        { id: "neonMetropolis", labelKey: "backgroundLibrary.neonMetropolis" },
        { id: "neonTunnel", labelKey: "backgroundLibrary.neonTunnel" },
        { id: "neonArcade", labelKey: "backgroundLibrary.neonArcade" }
    ] },
    { id: "cosmic", items: [
        { id: "cosmicSaturn", labelKey: "backgroundLibrary.cosmicSaturn" },
        { id: "cosmicGalaxy", labelKey: "backgroundLibrary.cosmicGalaxy" },
        { id: "cosmicEclipse", labelKey: "backgroundLibrary.cosmicEclipse" },
        { id: "cosmicMoon", labelKey: "backgroundLibrary.cosmicMoon" },
        { id: "cosmicCloud", labelKey: "backgroundLibrary.cosmicCloud" }
    ] }
] as const;
