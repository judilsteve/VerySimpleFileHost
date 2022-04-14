const routes = require('./src/routes').routes;

module.exports = () =>  Object.values(routes)
    .map(r => ({
        url: r.url,
        title: `${r.title} - VSFH`
    }));