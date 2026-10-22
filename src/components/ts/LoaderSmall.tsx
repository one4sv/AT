import "../../scss/Loading.scss";
export function LoaderSmall() {

    return (
        <div className="loaderSmall" role="status" aria-label="Загрузка">
            <div className="loadingSpinner" aria-hidden="true" />
        </div>
    );
}
