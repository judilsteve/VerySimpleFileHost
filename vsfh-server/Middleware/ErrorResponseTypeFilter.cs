using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace VerySimpleFileHost.Middleware;

public class ErrorResponseTypeFilter<T> : IOperationFilter
{
    private readonly int statusCode;

    public ErrorResponseTypeFilter(int statusCode)
    {
        this.statusCode = statusCode;
    }

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Responses.Add(statusCode.ToString(), new()
        {
            Content = new Dictionary<string, OpenApiMediaType>()
            {
                {
                    "application/json", new OpenApiMediaType()
                    {
                        Schema = context.SchemaGenerator.GenerateSchema(typeof(T), context.SchemaRepository)
                    }
                }
            }
        });
    }
}
