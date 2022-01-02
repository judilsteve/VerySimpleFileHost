using Microsoft.AspNetCore.Mvc;

namespace VerySimpleFileHost.Controllers;

[ApiController]
[Route("api/[controller]/[action]")]
public abstract class ControllerBase : Controller
{
}