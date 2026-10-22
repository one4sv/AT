import "../../scss/Extra.scss";
import "../../scss/Loading.scss";
export default function Loader() {

    return (
        <div className="pageLoader" role="status" aria-label="Загрузка" aria-busy="true">
            <div className="loading">
                <div className="loadingSpinner" aria-hidden="true" />
                <span>Загрузка...</span>
            </div>
        </div>
    );
}
