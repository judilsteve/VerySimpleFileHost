using Microsoft.AspNetCore.Mvc;
using VerySimpleFileHost.Middleware;

namespace VerySimpleFileHost.Controllers;

[ApiController]
[Route("[controller]")]
[ProducesResponseType(typeof(AuthenticationFailureDto), StatusCodes.Status401Unauthorized)]
public abstract class ControllerBase : Controller
{
}