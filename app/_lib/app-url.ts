import { getServerEnv } from "./env";

export const getAppUrl = () => getServerEnv().APP_URL.replace(/\/+$/, "");
