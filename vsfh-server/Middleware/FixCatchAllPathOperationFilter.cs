using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text.RegularExpressions;

// See https://github.com/domaindrivendev/Swashbuckle.AspNetCore/issues/1100
// openapi-generator-cli will throw validation errors on our OpenAPI spec without this workaround
// Note that even with this in place, the OpenAPI spec/Swagger UI still wrongly escapes slashes in the path string
public class FixCatchAllPathOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var template = context?.ApiDescription?.ActionDescriptor?.AttributeRouteInfo?.Template;

        if (template is null)
        {
            return;
        }

        var match = Regex.Match(template, @"{\*\*?([a-zA-Z0-9]+)}", RegexOptions.Compiled);

        if (match.Success)
        {
            var name = match.Groups[1].Value;
            context!.ApiDescription.RelativePath = context.ApiDescription!.RelativePath!.Replace($"{{{name}}}", $"{{*{name}}}");

            // Optionally, ensure there is a matching parameter for good measure.
            operation.Parameters.Single(p => p.Name == name);
        }
    }
}
