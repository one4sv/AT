import type { Area } from "react-easy-crop";

export default function getCroppedImg(
  file: File,
  crop: Area,
  blur: number = 0
): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const image = new Image();
      image.src = reader.result as string;

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Не удалось получить контекст");

        // Используем натуральный размер картинки
        const scaleX = image.naturalWidth / (crop.width || image.width);
        const scaleY = image.naturalHeight / (crop.height || image.height);

        const sx = (crop.x || 0) * scaleX;
        const sy = (crop.y || 0) * scaleY;
        const sw = (crop.width || image.width) * scaleX;
        const sh = (crop.height || image.height) * scaleY;

        canvas.width = sw;
        canvas.height = sh;

        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

        canvas.toBlob((blob) => {
          if (!blob) return reject("Ошибка при создании blob");
          resolve(new File([blob], file.name, { type: "image/png" }));
        }, "image/png");
      };

      image.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
