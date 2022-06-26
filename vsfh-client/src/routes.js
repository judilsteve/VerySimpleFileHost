const routes = {
    login: {
        pathname: '/Login/',
        title: 'Log In',
        prefetches: ['/api/Login/AuthConfig']
    },
    acceptInvite: {
        pathname: '/AcceptInvite/',
        title: 'Accept Invite',
        prefetches: ['/api/Login/AuthConfig']
    },
    changePassword: {
        pathname: '/ChangePassword/',
        title: 'Change Password',
        prefetches: [
            '/api/Login/AuthConfig',
            '/api/Login/AuthStatus'
        ]
    },
    manageUsers: {
        pathname: '/Admin/ManageUsers/',
        title: 'Manage Users',
        prefetches: [
            '/api/Login/AuthStatus',
            '/api/Users/ListUsers'
        ]
    },
    browseFiles: {
        pathname: '/Browse/',
        title: 'Browse',
        prefetches: [
            '/api/Login/AuthStatus',
            '/api/Files/Listing/?depth=1'
        ]
    },
    unauthorised: { pathname: '/Error/Unauthorised/', title: 'Unauthorised' },
    notFound: { pathname: '/Error/NotFound/', title: 'Not Found' }
};

// Note: Using old export syntax for compatibility with prerender-urls.js
module.exports = { routes };
