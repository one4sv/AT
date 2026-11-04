export const backgroundGroups = [
    { id: "essential", items: [
        { id: "landing", labelKey: "personalization.landingBackground" },
        { id: "default", labelKey: "personalization.contourShapes" },
        { id: "art", labelKey: "backgroundLibrary.art" },
        { id: "color", labelKey: "personalization.solidColor" }
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
        { id: "prism", labelKey: "backgroundLibrary.prism" }
    ] }
] as const;
