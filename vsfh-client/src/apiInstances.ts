import { Configuration, LoginApi } from "./API";

export const apiConfig = new Configuration({
    basePath: typeof Window === 'undefined' ? undefined : window.location.origin
});

export const loginApi = new LoginApi(apiConfig);