/* tslint:disable */
/* eslint-disable */
/**
 * 
 * @export
 * @interface AcceptInviteDto
 */
export interface AcceptInviteDto {
    /**
     * 
     * @type {string}
     * @memberof AcceptInviteDto
     */
    inviteKey?: string | null;
    /**
     * 
     * @type {string}
     * @memberof AcceptInviteDto
     */
    userName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof AcceptInviteDto
     */
    newPassword?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof AcceptInviteDto
     */
    rememberMe: boolean;
}
/**
 * 
 * @export
 * @enum {string}
 */
export enum ArchiveFormat {
    Tar = 'Tar',
    Zip = 'Zip'
}
/**
 * 
 * @export
 * @interface AuthConfigDto
 */
export interface AuthConfigDto {
    /**
     * 
     * @type {number}
     * @memberof AuthConfigDto
     */
    minimumPasswordScore?: number;
    /**
     * 
     * @type {boolean}
     * @memberof AuthConfigDto
     */
    allowRememberMe?: boolean;
}
/**
 * 
 * @export
 * @interface AuthenticationFailureDto
 */
export interface AuthenticationFailureDto {
    /**
     * 
     * @type {AuthenticationFailureReasonCode}
     * @memberof AuthenticationFailureDto
     */
    reasonCode?: AuthenticationFailureReasonCode;
    /**
     * 
     * @type {string}
     * @memberof AuthenticationFailureDto
     */
    reason?: string | null;
}
/**
 * 
 * @export
 * @enum {string}
 */
export enum AuthenticationFailureReasonCode {
    PasswordExpired = 'PasswordExpired',
    InvalidCredentials = 'InvalidCredentials',
    InvalidInviteKey = 'InvalidInviteKey'
}
/**
 * 
 * @export
 * @interface ChangePasswordAttemptDto
 */
export interface ChangePasswordAttemptDto {
    /**
     * 
     * @type {string}
     * @memberof ChangePasswordAttemptDto
     */
    userName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChangePasswordAttemptDto
     */
    currentPassword?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChangePasswordAttemptDto
     */
    newPassword?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof ChangePasswordAttemptDto
     */
    rememberMe: boolean;
}
/**
 * 
 * @export
 * @interface LoginAttemptDto
 */
export interface LoginAttemptDto {
    /**
     * 
     * @type {string}
     * @memberof LoginAttemptDto
     */
    userName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof LoginAttemptDto
     */
    password?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof LoginAttemptDto
     */
    rememberMe: boolean;
}
/**
 * 
 * @export
 * @interface UserAddRequestDto
 */
export interface UserAddRequestDto {
    /**
     * 
     * @type {string}
     * @memberof UserAddRequestDto
     */
    fullName?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof UserAddRequestDto
     */
    isAdministrator: boolean;
}
/**
 * 
 * @export
 * @interface UserEditDto
 */
export interface UserEditDto {
    /**
     * 
     * @type {string}
     * @memberof UserEditDto
     */
    fullName?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof UserEditDto
     */
    resetPassword: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof UserEditDto
     */
    isAdministrator?: boolean | null;
}
