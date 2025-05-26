export interface User {
    id: string;
    profilePicture: string;
    profileImage: string;
    photoUrl: string;
    fullName: string;
    isOnline:boolean;
    userName: string;
    connectionId: string;
    lastMessage: string;
    unreadCount: number;
    isTyping: boolean;
}