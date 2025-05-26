using System;
using System.Collections.Concurrent;
using API.Data;
using API.DTOs;
using API.Extensions;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace API.Hubs;


[Authorize]
public class ChatHub (UserManager<AppUser> userManager , AppDbContext context) : Hub
{
    public static readonly ConcurrentDictionary <String, OnlineUserDto>
    onlineUsers = new();
 
    public override async Task OnConnectedAsync()
    {
       var httpContext = Context.GetHttpContext();

       var recevierId = httpContext?.Request.Query["senderId"].ToString();

       var userName = Context.User!.Identity!.Name!;

       var currentUser = await userManager.FindByNameAsync(userName!);

       var connectionId = Context.ConnectionId;

       if(onlineUsers.ContainsKey(userName)){
        onlineUsers[userName].ConnectionId = connectionId;
       }else {
        var user = new OnlineUserDto {
            ConnectionId = connectionId,
            UserName = userName,
            ProfilePicture = currentUser!.ProfileImage,
            FullName = currentUser!.FullName,
        };

        onlineUsers.TryAdd(userName, user);

        await Clients.AllExcept(connectionId).SendAsync("Notify", currentUser);
       }

        if(!string.IsNullOrEmpty(recevierId)){
            await LoadMessages(recevierId);
        }
        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
    }

    public async Task LoadMessages(string recipientId, int pageNumber=1)
    {
       int pageSize = 10;
       var userName = Context.User!.Identity!.Name;
       var currentUser = await userManager.FindByNameAsync(userName!);

       if(currentUser is null) {
        return;
       }

       List<MessageResponseDto> messages = await context.Messages
       .Where(x => (x.ReceiverId == currentUser!.Id && x.SenderId ==
       recipientId) || (x.SenderId == currentUser!.Id && x.ReceiverId 
       == recipientId)).OrderByDescending(x => x.CreatedDate)
       .Skip((pageNumber-1)*pageSize)
       .Take(pageSize)
       .OrderBy(x=> x.CreatedDate)
       .Select(x => new MessageResponseDto{

            Id = x.Id,
            Content = x.Content,
            CreatedDate = x.CreatedDate,
            ReceiverId = x.ReceiverId,
            SenderId = x.SenderId,
       }).ToListAsync();


       foreach (var message in messages) {

        var msg = await context.Messages.FirstOrDefaultAsync(x => x.Id == message.Id);

        if(msg != null && msg.ReceiverId == currentUser.Id) {
            msg.IsRead = true;
            await context.SaveChangesAsync();
        }
       }

       await Task.Delay(1000);
    
       await Clients.User(currentUser.Id).SendAsync("ReceiveMessageList", messages);
    }

    public async Task SendMessage(MessageRequestDto message)

    {
        var senderId = Context.User!.Identity!.Name;
        var recevierId = message.ReceiverId;

        Console.WriteLine($"SenderId: {senderId}");
        Console.WriteLine($"ReceiverId: {recevierId}");

        var newMsg = new Message{
            Sender = await userManager.FindByNameAsync(senderId!),
            Receiver = await userManager.FindByIdAsync(recevierId!),
            IsRead = false,
            CreatedDate = DateTime.UtcNow,
            Content = message.Content
        };

        context.Messages.Add(newMsg);
        await context.SaveChangesAsync();

        await Clients.User(recevierId!).SendAsync("ReceiveNewMessage", newMsg);
    }

    public async Task NotifyTyping (string recipientUserName){
        
        var senderUserName = Context.User!.Identity!.Name;

        if (senderUserName is null ) {
            return;
        }

        var connectionId = onlineUsers.Values.FirstOrDefault(x => x.UserName == recipientUserName)?.ConnectionId;
        if (connectionId != null) {
           await Clients.Client(connectionId).SendAsync("NotifyTypingToUser", senderUserName);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userName = Context.User!.Identity!.Name;

        onlineUsers.TryRemove(userName!, out _);
        
        await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
    }
    private async Task<IEnumerable<OnlineUserDto>> GetAllUsers()
    {
        var username = Context.User!.GetUserName();

        var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);

        var users = await userManager.Users.Select(u => new OnlineUserDto {
            Id = u.Id,
            UserName = u.UserName,
            FullName = u.FullName,
            ProfilePicture = u.ProfileImage,
            IsOnline = onlineUsersSet.Contains(u.UserName!),
            UnreadCount = context.Messages.Count(m => m.ReceiverId  == username &&
            m.SenderId == u.Id && !m.IsRead)
        }).OrderByDescending(u => u.IsOnline).ToListAsync();

        return users;
    }

    public async Task SendGroupMessage(string groupName, string message)
    {
        await Clients.Group(groupName).SendAsync("ReceiveMessage", message);
    }

   
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }
}
