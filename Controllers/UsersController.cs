using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Utils;
using VerySimpleFileHost.Middleware;

namespace VerySimpleFileHost.Controllers;

[ApiController]
[Route("[controller]")]
[AdminOnly]
public class UsersController : Controller
{
    private readonly VsfhContext context;
    private readonly AuthenticationConfiguration configuration;

    public UsersController(
        VsfhContext context,
        AuthenticationConfiguration configuration
    )
    {
        this.context = context;
        this.configuration = configuration;
    }

    public class UserListingDto
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = null!;
        public bool IsAdministrator { get; init; }
        public bool Activated { get; init; }
    }

    [HttpGet]
    public IEnumerable<UserListingDto> ListUsers()
    {
        return context.Users
            .Select(u => new UserListingDto
            {
                Id = u.Id,
                Name = u.Name,
                IsAdministrator = u.IsAdministrator,
                Activated = u.PasswordHash != null
            });
    }

    public class UserAddRequestDto
    {
        public string Name { get; init; } = null!;
        public bool IsAdministrator { get; init; }
    }

    public class UserResponseDto
    {
        public Guid Id { get; init; }
        public string? InviteKey { get; init; }
    }

    public class UserDto : UserAddRequestDto
    {
        public Guid Id { get; init; }
    }

    [HttpPost]
    public async Task<ActionResult<UserResponseDto>> AddUser(UserAddRequestDto newUser)
    {
        var userId = Guid.NewGuid();
        var user = new Entities.User
        {
            Id = userId,
            IsAdministrator = newUser.IsAdministrator,
            Name = newUser.Name
        };

        var inviteKey = PasswordUtils.AssignInviteKey(user);

        await context.Users.AddAsync(user);

        try
        {
            await context.TrySaveChangesAsync();
        }
        catch(UniqueIndexConstraintViolationException)
        {
            return BadRequest($"A user with this name already exists");
        }

        return new UserResponseDto
        {
            Id = userId,
            InviteKey = inviteKey
        };
    }

    public class UserEditDto
    {
        public string? Name { get; init; }
        [Required] public bool? ResetPassword { get; init; }
        public bool? IsAdministrator { get; init; }
    }

    [HttpPut("{userId}")]
    public async Task<ActionResult<UserResponseDto>> EditUser([Required]Guid userId, UserEditDto userDto)
    {
        var user = await context.Users
            .AsTracking()
            .SingleOrDefaultAsync(u => u.Id == userId);

        if(user is null) return NotFound();

        user.Name = userDto.Name ?? user.Name;
        user.IsAdministrator = userDto.IsAdministrator ?? user.IsAdministrator;

        var inviteKey = userDto.ResetPassword!.Value
            ? PasswordUtils.AssignInviteKey(user)
            : (string?)null;

        try
        {
            await context.TrySaveChangesAsync();
        }
        catch(UniqueIndexConstraintViolationException)
        {
            return BadRequest($"A user with this name already exists");
        }

        return new UserResponseDto
        {
            Id = user.Id,
            InviteKey = inviteKey
        };
    }

    [HttpDelete("{userId}")]
    public async Task<ActionResult> DeleteUser([Required]Guid? userId)
    {
        var user = await context.Users
            .AsTracking()
            .SingleOrDefaultAsync(u => u.Id == userId);

        if(user is null) return NotFound();

        context.Remove(user);

        await context.SaveChangesAsync();

        return Ok();
    }
}