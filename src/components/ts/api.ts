import axios from "axios";
export const api = axios.create({
    baseURL: "/api/",
    withCredentials: true
});
export type ConnectionIssue = "offline" | "server" | "region" | null;
let connectionIssue: ConnectionIssue = null;
export const getConnectionIssue = () => connectionIssue;
const reportConnection = (issue: ConnectionIssue) => {
    connectionIssue = issue;
    window.dispatchEvent(new Event("at-connection"));
};
api.interceptors.response.use(
    response => {
        // Only a dedicated health check clears an error; unrelated requests can race.
        if (response.config.url === "ping") reportConnection(null);
        return response;
    },
    error => {
        if (!axios.isCancel(error)) {
            const status = error.response?.status;
            if (error.response?.data?.code === "GEO_BLOCKED") reportConnection("region"); else if (!navigator.onLine) reportConnection("offline"); else if (!error.response || status >= 502) reportConnection("server");
        }
        return Promise.reject(error);
    }
);
