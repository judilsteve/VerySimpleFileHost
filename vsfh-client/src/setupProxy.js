// This file is only used by next.js at dev time
// TODO_JU Is this still needed?

const createProxyMiddleware = require('http-proxy-middleware');

function useProxy(app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:5299'
        })
    );
}

module.exports = useProxy;
