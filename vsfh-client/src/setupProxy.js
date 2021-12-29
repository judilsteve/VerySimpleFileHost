// This file is only used by craco at dev time

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
