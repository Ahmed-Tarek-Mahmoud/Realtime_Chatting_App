using System;
using Microsoft.AspNetCore.Identity;

namespace API.Models;

public class Group
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Image { get; set; }
}