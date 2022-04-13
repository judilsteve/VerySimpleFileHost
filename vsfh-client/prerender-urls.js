const routes = require('./src/routes').routes;

module.exports = function() {
    preRenderRoutes = Object.values(routes).map(r => ({
        url: r.url,
        title: `${r.title} - VSFH`
    }));

    return [
        ...preRenderRoutes,
        // TODO_JU 404/403
    ];
};