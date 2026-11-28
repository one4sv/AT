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

const materializedFiles = new WeakSet<File>();

export function isAppleFileProvider() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// Detach provider-backed File handles while they are still readable.
export async function materializeDroppedFiles(files: File[]): Promise<File[]> {
    if (!isAppleFileProvider()) return files;
    if (files.reduce((sum, file) => sum + file.size, 0) > 50_000_000) {
        throw new Error("CHAT_FILE_LIMIT");
    }
    return Promise.all(files.map(async file => {
        if (materializedFiles.has(file)) return file;
        const bytes = await file.arrayBuffer();
        if (bytes.byteLength !== file.size || !bytes.byteLength) throw new Error("FILE_UNREADABLE");
        const prepared = new File([bytes], file.name, { type: file.type, lastModified: file.lastModified });
        materializedFiles.add(prepared);
        return prepared;
    }));
}
