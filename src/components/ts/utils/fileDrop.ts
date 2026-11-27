export function hasFileDrop(data: DataTransfer) {
    return Array.from(data.types).includes("Files") || Array.from(data.items).some(item => item.kind === "file");
}

export function getDroppedFiles(data: DataTransfer): File[] {
    const files = Array.from(data.files);
    if (files.length) return files;
    return Array.from(data.items)
        .filter(item => item.kind === "file")
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null);
}
