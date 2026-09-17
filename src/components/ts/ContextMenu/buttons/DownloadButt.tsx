import { DownloadSimple } from "@phosphor-icons/react";

export const DownloadButt = ( url:string, name:string ) => {
    const handleDownload = async () => {
        const response = await fetch(url);
        const blob = await response.blob();

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name || "image";
        a.click();

        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="ContextMenuButt" onClick={handleDownload}>
            <DownloadSimple/>
            Сохранить
        </div>
    );
}