import { Configuration, LoginApi } from "./API";
import safeWindow from "./Utils/safeWindow";

export const apiConfig = new Configuration({ basePath: safeWindow?.location.origin });

export const loginApi = new LoginApi(apiConfig);