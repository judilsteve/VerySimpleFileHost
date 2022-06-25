const routes = {
    login: { pathname: '/Login/', title: 'Log In' },
    acceptInvite: { pathname: '/AcceptInvite/', title: 'Accept Invite' },
    changePassword: { pathname: '/ChangePassword/', title: 'Change Password' },
    manageUsers: { pathname: '/Admin/ManageUsers/', title: 'Manage Users' },
    browseFiles: { pathname: '/Browse/', title: 'Browse' },
    unauthorised: { pathname: '/Error/Unauthorised/', title: 'Unauthorised' },
    notFound: { pathname: '/Error/NotFound/', title: 'Not Found' }
};

// Note: Using old export syntax for compatibility with prerender-urls.js
module.exports = { routes };
