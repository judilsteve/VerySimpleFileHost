// Note: Using old syntax for compatibility with prerender-urls.js

const routes = {
    login: { pathname: '/Login/', title: 'Log In' },
    acceptInvite: { pathname: '/AcceptInvite/', title: 'Accept Invite' },
    changePassword: { pathname: '/ChangePassword/', title: 'Change Password' },
    manageUsers: { pathname: '/Admin/ManageUsers/', title: 'Manage Users' },
    browseFiles: { pathname: '/Browse/', title: 'Browse' },
    unauthorised: { pathname: '/Error/Unauthorised/', title: 'Unauthorised' },
    notFound: { pathname: '/Error/NotFound/', title: 'Not Found' }
};

const routeTitlesByPathname = {};
for (const route of Object.values(routes)) {
    routeTitlesByPathname[route.pathname] = route.title;
}

module.exports = {
    routes,
    routeTitlesByPathname
};
