using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace VerySimpleFileHost.Utils;

public static class SelfSignedCertProvider
{
    private static readonly ConcurrentDictionary<string, (X509Certificate2 cert, DateTimeOffset expiry)> certs = new();

    private static (X509Certificate2 cert, DateTimeOffset expiry) MakeCert(string host)
    {
        using var ecdsa = ECDsa.Create(); // Not sure if this class is thread-safe, so I'm not making this a static member
        var req = new CertificateRequest($"cn={host}", ecdsa, HashAlgorithmName.SHA256);
        var now = DateTimeOffset.UtcNow;
        var expiry = now.AddYears(1);
        return (req.CreateSelfSigned(now, expiry), expiry);
    }

    public static X509Certificate2 GetCert(string host)
    {
        var foundCachedCert = certs.TryGetValue(host, out var cachedCertTuple);
        if(foundCachedCert && cachedCertTuple.expiry > DateTimeOffset.UtcNow.AddDays(-1))
        {
            return cachedCertTuple.cert;
        }
        var (newCert, newExpiry) = MakeCert(host);
        certs[host] = (newCert, newExpiry);
        if(foundCachedCert) cachedCertTuple.cert.Dispose();
        return newCert;
    }
}