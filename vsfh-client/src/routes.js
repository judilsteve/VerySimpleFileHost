// Note: Using old syntax for compatibility with prerender-urls.js

const routes = {
    login: { url: '/Login', title: 'Log In' },
    acceptInvite: { url: '/AcceptInvite', title: 'Accept Invite' },
    changePassword: { url: '/ChangePassword', title: 'Change Password' },
    manageUsers: { url: '/Admin/ManageUsers', title: 'Manage Users' },
    browseFiles: { url: '/Browse', title: 'Browse' },
    unauthorised: { url: '/Error/Unauthorised', title: 'Unauthorised' },
    notFound: { url: '/Error/NotFound', title: 'Not Found' }
};

module.exports = {
    routes: routes
};
