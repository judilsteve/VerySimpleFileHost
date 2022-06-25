const { routes } = require('./src/routes');

module.exports = () =>  Object.values(routes)
    .map(r => ({
        url: r.pathname,
        title: `${r.title} - VSFH`,
        pathname: r.pathname
    }));
