import { useTranslation } from "react-i18next";
import PageBottom from "../../components/ts/PageBottom";
import "../../scss/Loading.scss";
import "./scss/postPage.scss";
import "./scss/postEditor.scss";

export default function PostEditorSkeleton({ onBack }: { onBack?: () => void }) {
    const { t } = useTranslation("acc");

    return (
        <div className="postPage postEditor postEditorSkeleton">
            <div
                className="postPageScroll"
                role="status"
                aria-busy="true"
                aria-label={t("post.loading")}
            >
                <div className="postToolbar" aria-hidden="true">
                    <div>
                        {Array.from({ length: 12 }, (_, index) => (
                            <div className="skeletonBlock postSkeletonTool" key={index} />
                        ))}
                    </div>
                </div>
                <div className="postTA" aria-hidden="true">
                    <div className="postRichInput skeletonText">
                        <div className="skeletonLine skeletonTitle" />
                        <div className="skeletonLine" />
                        <div className="skeletonLine" />
                        <div className="skeletonLine skeletonShort" />
                    </div>
                </div>
            </div>
            <PageBottom onBack={onBack}>
                {!onBack && <div className="skeletonCircle postSkeletonBack" aria-hidden="true" />}
                <div className="skeletonBlock postSkeletonSettings" aria-hidden="true" />
                <div className="skeletonCircle postSkeletonSend" aria-hidden="true" />
            </PageBottom>
        </div>
    );
}
