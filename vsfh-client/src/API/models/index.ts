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
 * @interface DirectoryDto
 */
export interface DirectoryDto {
    /**
     * 
     * @type {string}
     * @memberof DirectoryDto
     */
    displayName?: string | null;
    /**
     * 
     * @type {Array<FileDto>}
     * @memberof DirectoryDto
     */
    files?: Array<FileDto> | null;
    /**
     * 
     * @type {Array<DirectoryDto>}
     * @memberof DirectoryDto
     */
    subdirectories?: Array<DirectoryDto> | null;
}
/**
 * 
 * @export
 * @interface FileDto
 */
export interface FileDto {
    /**
     * 
     * @type {string}
     * @memberof FileDto
     */
    displayName?: string | null;
    /**
     * 
     * @type {number}
     * @memberof FileDto
     */
    sizeBytes?: number;
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
/**
 * 
 * @export
 * @interface UserListingDto
 */
export interface UserListingDto {
    /**
     * 
     * @type {string}
     * @memberof UserListingDto
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof UserListingDto
     */
    fullName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof UserListingDto
     */
    loginName?: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof UserListingDto
     */
    isAdministrator?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof UserListingDto
     */
    activated?: boolean;
}
/**
 * 
 * @export
 * @interface UserResponseDto
 */
export interface UserResponseDto {
    /**
     * 
     * @type {string}
     * @memberof UserResponseDto
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof UserResponseDto
     */
    inviteKey?: string | null;
}
