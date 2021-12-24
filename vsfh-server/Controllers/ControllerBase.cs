using Microsoft.AspNetCore.Mvc;

namespace VerySimpleFileHost.Controllers;

[ApiController]
[Route("[controller]")]
public abstract class ControllerBase : Controller
{
}