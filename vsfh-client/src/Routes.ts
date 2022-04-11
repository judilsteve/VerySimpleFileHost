export const inviteKeyParamName = 'inviteKey';
export const routes = {
    login: '/Login',
    acceptInvite: `/AcceptInvite/:${inviteKeyParamName}`,
    changePassword: '/ChangePassword',
    manageUsers: '/Admin/ManageUsers',
    browseFiles: '/Browse'
};
