import type { Media } from "../../../components/context/ChatContext";
import { useBlackout } from "../../../components/hooks/BlackoutHook";

export default function AccMedia({ media }: { media: Media[] }) {
    const { setBlackout } = useBlackout()

    return (
        <div className="accMedia">
            {media.map((file, i) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");

                return (
                    <div key={i} className="accMediaItem">
                        {isImage ? (
                            <img
                                src={file.url}
                                alt={file.name}
                                className="accMediaPreview"
                                onClick={() =>
                                    setBlackout({ seted: true, module:"ImgPrev", img: file.url })
                                }
                            />
                        ) : isVideo ? (
                            <video
                                src={file.url}
                                className="accMediaPreview"
                                controls
                            />
                        ) : (
                            <a
                                href={file.url}
                                download={file.name}
                                className="accMediaOther"
                            >
                                <span className="accMediaFileName">{file.name}</span>
                            </a>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
