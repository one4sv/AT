import type { Area } from "react-easy-crop";

export default async function getCroppedImg(file: File, crop: Area, blur: number = 0): Promise<File> {
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();

        const canvas = document.createElement("canvas");
        const maxEdge = 2560;
        const scale = Math.min(1, maxEdge / Math.max(crop.width, crop.height));
        canvas.width = Math.max(1, Math.round(crop.width * scale));
        canvas.height = Math.max(1, Math.round(crop.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is unavailable");
        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(result => result ? resolve(result) : reject(new Error("Encoding failed")), "image/webp", .9);
        });
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
    } finally {
        URL.revokeObjectURL(url);
    }
}
