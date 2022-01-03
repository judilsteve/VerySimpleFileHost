import * as runtime from '../API/runtime';
import { ApiFilesListingPathGetRequest, DirectoryDto, FilesApi } from "../API";

class FilesApiOverride extends FilesApi {
    // Copy/pasted from auto-generated code 
    async apiFilesListingPathGetRaw(requestParameters: ApiFilesListingPathGetRequest, initOverrides?: RequestInit): Promise<runtime.ApiResponse<DirectoryDto>> {
        if (requestParameters.path === null || requestParameters.path === undefined) {
            throw new runtime.RequiredError('path','Required parameter requestParameters.path was null or undefined when calling apiFilesListingPathGet.');
        }

        const queryParameters: any = {};

        if (requestParameters.depth !== undefined) {
            queryParameters['depth'] = requestParameters.depth;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/api/Files/Listing/{path}`.replace(`{${"path"}}`, /*encodeURIComponent(*/String(requestParameters.path)/*)*/),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response);
    }
}

export default FilesApiOverride;