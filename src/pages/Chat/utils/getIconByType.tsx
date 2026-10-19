import { File, FileText, FileArchive, FileAudio,
  FileCode, FileXls, FilePpt,
} from "@phosphor-icons/react";

export default function GetIconByType(name:string, type:string) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (type.startsWith("audio/")) return <FileAudio size={26}/>;
    if (ext === "zip" || ext === "rar" || ext === "7z") return <FileArchive size={26}/>;
    if (ext === "pdf") return <FileText size={26}/>;
    if (["doc", "docx"].includes(ext || "")) return <FileText size={26}/>;
    if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileXls size={26}/>;
    if (["ppt", "pptx"].includes(ext || "")) return <FilePpt size={26}/>;
    if (["js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "cpp", "c", "cs", "java"].includes(ext || "")) return <FileCode size={26}/>;
    return <File size={26}/>;
}