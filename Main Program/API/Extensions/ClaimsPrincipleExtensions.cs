using System;
using System.Security.Claims;

namespace API.Extensions;

public static class ClaimsPrincipleExtensions
{
    public static string? GetUserName(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Name) ?? throw new Exception("Username not found");
    }

    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        return Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new Exception("UserId not found"));
    }
}   
