import "../../scss/Loading.scss";

export default function MinLoader() {
    return (
        <div className="minLoader" role="status" aria-label="Загрузка">
            <div className="loadingSpinner" aria-hidden="true" />
        </div>
    )
}