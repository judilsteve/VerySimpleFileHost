using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VerySimpleFileHost.Configuration;
using VerySimpleFileHost.Database;
using VerySimpleFileHost.Utils;
using VerySimpleFileHost.Middleware;

namespace VerySimpleFileHost.Controllers;

[AdminOnly]
public class UsersController : ControllerBase
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
        public string FullName { get; init; } = null!;
        public string? LoginName { get; init; }
        public bool IsAdministrator { get; init; }
        public bool Activated { get; init; }
    }

    [HttpGet]
    [CompressResponse]
    public IAsyncEnumerable<UserListingDto> ListUsers()
    {
        return context.Users
            .Select(u => new UserListingDto
            {
                Id = u.Id,
                FullName = u.FullName,
                LoginName = u.LoginName,
                IsAdministrator = u.IsAdministrator,
                Activated = u.PasswordSaltedHash != null
            })
            .AsAsyncEnumerable();
    }

    public class UserAddRequestDto
    {
        [MinLength(1)] public string FullName { get; init; } = null!;
        [Required] public bool? IsAdministrator { get; init; }
    }

    public class UserResponseDto
    {
        public Guid Id { get; init; }
        public string? InviteKey { get; init; }
    }

    public class UserDto : UserAddRequestDto
    {
        [Required] public Guid? Id { get; init; }
    }

    [HttpPost]
    public async Task<ActionResult<UserResponseDto>> AddUser(UserAddRequestDto newUser)
    {
        var userId = Guid.NewGuid();
        var user = new Entities.User
        {
            Id = userId,
            IsAdministrator = newUser.IsAdministrator!.Value,
            FullName = newUser.FullName
        };

        var inviteKey = PasswordUtils.AssignInviteKey(user);

        await context.Users.AddAsync(user);

        await context.SaveChangesAsync();

        return new UserResponseDto
        {
            Id = userId,
            InviteKey = inviteKey
        };
    }

    public class UserEditDto
    {
        public string? FullName { get; init; }
        [Required] public bool? ResetPassword { get; init; }
        public bool? IsAdministrator { get; init; }
    }

    [HttpPut("{userId}")]
    public async Task<ActionResult<UserResponseDto>> EditUser([Required]Guid? userId, UserEditDto userDto)
    {
        var user = await context.Users
            .AsTracking()
            .SingleOrDefaultAsync(u => u.Id == userId);

        if(user is null) return NotFound();

        user.FullName = string.IsNullOrWhiteSpace(userDto.FullName) ? user.FullName : userDto.FullName;
        user.IsAdministrator = userDto.IsAdministrator ?? user.IsAdministrator;

        var inviteKey = userDto.ResetPassword!.Value
            ? PasswordUtils.AssignInviteKey(user)
            : (string?)null;

        await context.SaveChangesAsync();

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
