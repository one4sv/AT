import { useEffect } from "react";

export function useVisualViewport() {
    useEffect(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        const update = () => {
            // Берем высоту визуального вьюпорта
            let currentHeight = viewport.height;

            // Проверяем, открыта ли клавиатура (высота вьюпорта становится значительно меньше высоты экрана)
            const isKeyboardOpen = window.innerHeight - currentHeight > 150;

            if (isKeyboardOpen) {
                // Если клавиатура открыта, убираем возможные микро-щели снизу
                currentHeight = Math.ceil(currentHeight);
            }

            document.documentElement.style.setProperty(
                "--vv-height",
                `${currentHeight}px`
            );

            document.documentElement.style.setProperty(
                "--vv-top",
                `${viewport.offsetTop}px`
            );
        };

        update();

        // Добавляем дополнительные триггеры для iOS, чтобы избежать задержек отрисовки
        viewport.addEventListener("resize", update);
        viewport.addEventListener("scroll", update);
        window.addEventListener("orientationchange", update);

        return () => {
            viewport.removeEventListener("resize", update);
            viewport.removeEventListener("scroll", update);
            window.removeEventListener("orientationchange", update);
        };
    }, []);
}
