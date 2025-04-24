using System;
using Microsoft.AspNetCore.Identity;

namespace RealTimeChattingApplication.Models
{
    public class AppUser : IdentityUser
    {

        public string? FullName { get; set; }
        public string? ProfileImage { get; set; }
    }
}
