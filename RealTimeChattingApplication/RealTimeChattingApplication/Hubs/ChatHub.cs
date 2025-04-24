using RealTimeChattingApplication.DTOs;
using RealTimeChattingApplication.Extensions;
using RealTimeChattingApplication.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using RealTimeChattingApplication.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace RealTimeChattingApplication.Hubs
{
    public class ChatHub(UserManager<AppUser> userManager , AppDbContext context) : Hub
    {
        public static readonly ConcurrentDictionary<string, OnlineUserDto> onlineUsers = new();
        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var receiverId = httpContext?.Request.Query["senderId"].ToString();
            var userName = Context.User!.Identity!.Name;
            var currentUser = await userManager.FindByNameAsync(userName);
            var connectionId = Context.ConnectionId;

            if (onlineUsers.ContainsKey(userName))
            {
                onlineUsers[userName].ConnectionId = connectionId;
            }
            else
            {
                var user = new OnlineUserDto
                {
                    ConnectionId = connectionId,
                    UserName = userName,
                    ProfilePicture = currentUser!.ProfileImage,
                    FullName = currentUser.FullName,
                };
                onlineUsers.TryAdd(userName, user);
                await Clients.AllExcept(connectionId).SendAsync("Notify", currentUser);
            }
            if (!string.IsNullOrEmpty(receiverId))
            {
                await LoadMessages(receiverId);
            }
            await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
        }

        public async Task NotifyTyping(string recipientUserName)
        {
            var senderUserName = Context.User!.Identity!.Name;
            if (senderUserName is null) {
                return;
            }
            var connectionId = onlineUsers.Values
                .FirstOrDefault(u => u.UserName == recipientUserName)?.ConnectionId;
            if (connectionId != null)
            {
                await Clients.Client(connectionId).SendAsync("NotifyTypingToUser", senderUserName);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var username = Context.User!.Identity!.Name;
            onlineUsers.TryRemove(username!, out _);
            await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
        }
        public async Task SendMessage(MessageResquestDto message)
        {
            var senderId = Context.User!.Identity!.Name;
            var receiverId = message.ReceiverId;
            var messageToSend = new Message
            {
                Sender = await userManager.FindByNameAsync(senderId!),
                Receiver = await userManager.FindByIdAsync(receiverId!),
                IsRead = false,
                CreatedDate = DateTime.UtcNow,
                Content = message.Content
            };

            context.Messages.Add(messageToSend);
            await context.SaveChangesAsync();
            await Clients.User(receiverId!).SendAsync("ReceiveNewMessage", messageToSend);
        }
        private async Task<IEnumerable<OnlineUserDto>> GetAllUsers()
        {
            var username = Context.User!.GetUsername();
            var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);
            var users = await userManager.Users.Select(u => new OnlineUserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                ProfilePicture = u.ProfileImage,
                FullName = u.FullName,
                IsOnline = onlineUsersSet.Contains(u.UserName!),
                UnreadCount = context.Messages.Count(m => m.ReceiverId == username && m.SenderId == u.Id && m.IsRead == false)
            }).OrderByDescending(u => u.IsOnline).ToListAsync();

            return users;
        }
        public async Task LoadMessages(string receiverId , int pageNumber = 1)
        {
            int pageSize = 10;
            var username = Context.User!.Identity!.Name;
            var currentUser = await userManager.FindByNameAsync(username);
            if (currentUser == null)
            {
                return;
            }
            List<MessageResponseDto> messages = await context.Messages
                .Where(x => x.ReceiverId == currentUser!.Id && x.SenderId == receiverId
                || x.SenderId == currentUser!.Id && x.ReceiverId == receiverId).OrderByDescending(x => x.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .OrderBy(x => x.CreatedDate)
                .Select(x => new MessageResponseDto
                {
                    Id = x.Id,
                    SenderId = x.SenderId,
                    ReceiverId = x.ReceiverId,
                    Content = x.Content,
                    CreatedDate = x.CreatedDate,
                }).ToListAsync();
            foreach (var message in messages)
            {
                var msg = await context.Messages
                    .FirstOrDefaultAsync(x => x.Id == message.Id);
                if (msg != null && msg.ReceiverId == currentUser.Id)
                {
                    msg.IsRead = true;
                    await context.SaveChangesAsync();
                }
            }
            await Clients.User(currentUser.Id).SendAsync("RecieveMessageList", messages);
        }
    }
}   
