namespace VerySimpleFileHost.Configuration;

public class LettuceEncryptConfiguration
{
    public bool AcceptTermsOfService { get; init; }
    public string[]? DomainNames { get; init; }
    public string? EmailAddress { get; init; }
}