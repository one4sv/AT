export default function getCroppedImg(file: File, crop: { x: number; y: number; width: number; height: number }) {
    return new Promise<File>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const image = new Image()
            image.src = reader.result as string
            image.onload = () => {
                const canvas = document.createElement("canvas")
                canvas.width = crop.width
                canvas.height = crop.height
                const ctx = canvas.getContext("2d")
                if (!ctx) return reject("Не удалось получить контекст")
                ctx.drawImage(
                    image,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    0,
                    0,
                    crop.width,
                    crop.height
                )

                // Преобразуем в файл
                canvas.toBlob((blob) => {
                    if (!blob) return reject("Ошибка при создании blob")
                    resolve(new File([blob], file.name, { type: "image/png" }))
                }, "image/png")
            }
            image.onerror = (err) => reject(err)
        }
        reader.onerror = (err) => reject(err)
    })
}
