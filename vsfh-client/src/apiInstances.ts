import { Configuration, LoginApi } from "./API";

export const apiConfig = new Configuration({ basePath: window.location.origin });

export const loginApi = new LoginApi(apiConfig);