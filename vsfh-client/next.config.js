module.exports = {
    async rewrites() {
      return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:5299/:path*' // Proxy to Backend
            }
        ]
    }
}