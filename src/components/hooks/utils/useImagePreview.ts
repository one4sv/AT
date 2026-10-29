import type { MouseEvent } from "react";
import { useBlackout } from "../BlackoutHook";

interface PreviewImage {
    url: string;
    name: string;
    type?: string;
}

export default function useImagePreview(files: PreviewImage[]) {
    const { setBlackout } = useBlackout();

    return (file: PreviewImage, event?: MouseEvent) => {
        event?.stopPropagation();
        const images = files.filter(item => item.type?.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif)(?:[?#]|$)/i.test(item.url));
        const imageIndex = images.findIndex(item => item.url === file.url);
        if (imageIndex < 0) return;

        setBlackout({
            seted: true,
            module: "ImgPrev",
            img: file.url,
            images: images.map(item => ({
                url: item.url,
                name: item.name,
                options: { name: item.name, url: item.url }
            })),
            imageIndex,
            options: { name: file.name, url: file.url }
        });
    };
}
