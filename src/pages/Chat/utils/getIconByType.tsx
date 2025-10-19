import { File, FileText, FileArchive, FileAudio,
  FileCode, FileXls, FilePpt,
} from "@phosphor-icons/react";

export default function GetIconByType(name:string, type:string) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (type.startsWith("audio/")) return <FileAudio />;
    if (ext === "zip" || ext === "rar" || ext === "7z") return <FileArchive />;
    if (ext === "pdf") return <FileText />;
    if (["doc", "docx"].includes(ext || "")) return <FileText />;
    if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileXls />;
    if (["ppt", "pptx"].includes(ext || "")) return <FilePpt />;
    if (["js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "cpp", "c", "cs", "java"].includes(ext || "")) return <FileCode />;
    return <File />;
}