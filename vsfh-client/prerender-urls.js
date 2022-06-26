const { routes } = require('./src/routes');

module.exports = () =>  Object.values(routes)
    .map(r => ({
        ...r,
        url: r.pathname,
        title: `${r.title} - VSFH`,
    }));
