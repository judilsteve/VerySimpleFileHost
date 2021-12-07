/* tslint:disable */
/* eslint-disable */
/**
 * VerySimpleFileHost
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import {
    AcceptInviteDto,
    ChangePasswordAttemptDto,
    LoginAttemptDto,
} from '../models';

export interface LoginAcceptInvitePostRequest {
    acceptInviteDto?: AcceptInviteDto;
}

export interface LoginChangePasswordPutRequest {
    changePasswordAttemptDto?: ChangePasswordAttemptDto;
}

export interface LoginPostRequest {
    loginAttemptDto?: LoginAttemptDto;
}

/**
 * 
 */
export class LoginApi extends runtime.BaseAPI {

    /**
     */
    async loginAcceptInvitePostRaw(requestParameters: LoginAcceptInvitePostRequest, initOverrides?: RequestInit): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/Login/AcceptInvite`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: requestParameters.acceptInviteDto,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async loginAcceptInvitePost(requestParameters: LoginAcceptInvitePostRequest, initOverrides?: RequestInit): Promise<void> {
        await this.loginAcceptInvitePostRaw(requestParameters, initOverrides);
    }

    /**
     */
    async loginChangePasswordPutRaw(requestParameters: LoginChangePasswordPutRequest, initOverrides?: RequestInit): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/Login/ChangePassword`,
            method: 'PUT',
            headers: headerParameters,
            query: queryParameters,
            body: requestParameters.changePasswordAttemptDto,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async loginChangePasswordPut(requestParameters: LoginChangePasswordPutRequest, initOverrides?: RequestInit): Promise<void> {
        await this.loginChangePasswordPutRaw(requestParameters, initOverrides);
    }

    /**
     */
    async loginLogoutPostRaw(initOverrides?: RequestInit): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/Login/Logout`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async loginLogoutPost(initOverrides?: RequestInit): Promise<void> {
        await this.loginLogoutPostRaw(initOverrides);
    }

    /**
     */
    async loginMinimumPasswordScoreGetRaw(initOverrides?: RequestInit): Promise<runtime.ApiResponse<number>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/Login/MinimumPasswordScore`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.TextApiResponse(response) as any;
    }

    /**
     */
    async loginMinimumPasswordScoreGet(initOverrides?: RequestInit): Promise<number> {
        const response = await this.loginMinimumPasswordScoreGetRaw(initOverrides);
        return await response.value();
    }

    /**
     */
    async loginPingGetRaw(initOverrides?: RequestInit): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/Login/Ping`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async loginPingGet(initOverrides?: RequestInit): Promise<void> {
        await this.loginPingGetRaw(initOverrides);
    }

    /**
     */
    async loginPostRaw(requestParameters: LoginPostRequest, initOverrides?: RequestInit): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/Login`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: requestParameters.loginAttemptDto,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async loginPost(requestParameters: LoginPostRequest, initOverrides?: RequestInit): Promise<void> {
        await this.loginPostRaw(requestParameters, initOverrides);
    }

}
