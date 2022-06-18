const routes = require('./src/routes').routes;

module.exports = () =>  Object.values(routes)
    .map(r => ({
        url: `${r.url}.html`, // Without this, `Login` renders to `Login/index.html` instead of `Login.html`
        title: `${r.title} - VSFH`
    }));