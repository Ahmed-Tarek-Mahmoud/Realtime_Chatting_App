using System.Text;
using API.Data;
using API.EndPoints;
using API.Hubs;
using API.Models;
using API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:4200", 
        "https://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var JwtSetting = builder.Configuration.GetSection("JWTSetting");
// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

builder.Services.AddDbContext<AppDbContext> (o => o.UseSqlServer( builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddIdentityCore<AppUser>()
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddScoped<TokenService>();
 
builder.Services.AddAuthentication(opt => {
    opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    opt.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(option => {
        option.SaveToken = true;
        option.RequireHttpsMetadata = false;
        option.TokenValidationParameters = new TokenValidationParameters{
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(JwtSetting.GetSection("SecurityKey").Value!)),
            ValidateIssuer = false,
            ValidateAudience = false,
        };

        option.Events = new JwtBearerEvents {
            OnMessageReceived = context => {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if(!string.IsNullOrEmpty(accessToken) && 
                path.StartsWithSegments("/hubs")) {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });


builder.Services.AddOpenApi();
builder.Services.AddAuthorization();
builder.Services.AddSignalR();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseCors(x => x.AllowAnyHeader()
.AllowAnyMethod()
.AllowCredentials()
.WithOrigins("http://localhost:4200", "https://localhost:4200"));


app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Content-Type", "text/html; charset=utf-8");
    await next.Invoke();
});

//app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<ChatHub>("hubs/chat");
app.MapHub<VideoChatHub>("hubs/video");
app.UseStaticFiles();
//Call the endpoint to handle account registeration
app.MapAccountEndpoint();
app.Run();
