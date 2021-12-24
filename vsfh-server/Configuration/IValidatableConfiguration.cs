namespace VerySimpleFileHost.Configuration;

public interface IValidatableConfiguration
{
    IEnumerable<string> Validate();
}
