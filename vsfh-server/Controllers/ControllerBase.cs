using Microsoft.AspNetCore.Mvc;

namespace VerySimpleFileHost.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ControllerBase : Controller
{
}