import { AfterViewChecked, Component, ElementRef, inject, ViewChild, viewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';


@Component({
  selector: 'app-chat-box',
  imports: [MatProgressSpinner,DatePipe, MatIconModule],
  templateUrl: './chat-box.component.html',
  styles: [`
    .chat-box {
  scroll-behavior: smooth;
  overflow-y: hidden;
  padding: 10px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  height: 70vh;
  border-radius: 5px;
  position: relative;
}

/* Enable scrolling only on hover */
.chat-box:hover {
  overflow-y: auto;
}

/* Thin scrollbar */
.chat-box::-webkit-scrollbar {
  width: 5px;
}

/* Hide scrollbar by default */
.chat-box::-webkit-scrollbar-thumb {
  background-color: transparent;
  transition: background-color 0.3s;
}

.chat-box:hover::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
}

.chat-box::-webkit-scrollbar-track {
  background: transparent;
}

/* Optional: Change scrollbar thumb on hover */
.chat-box:hover::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.chat-icon {
  width: 40px;
  height: 40px;
  font-size: 48px;
}
 `]
})

export class ChatBoxComponent implements AfterViewChecked {
  

  @ViewChild('chatBox', {read:ElementRef}) public chatBox?: ElementRef;

  chatService = inject(ChatService);
  authService = inject(AuthService);

  private pageNumber = 2;

  loadMoreMessages() {
    this.pageNumber++;
    this.chatService.loadMessages(this.pageNumber);
    this.scrollToTop();
  }

  ngAfterViewChecked(): void {
    if(this.chatService.autoScrollEnabled()){
      this.scrollToBottom();
    }
  }

  scrollToBottom(){
    this.chatService.autoScrollEnabled.set(true);
    this.chatBox!.nativeElement.scrollTo({
      top:this.chatBox!.nativeElement.scrollHeight,
      behavior:'smooth'
    })
  }

   scrollToTop(){
    this.chatService.autoScrollEnabled.set(false);
    this.chatBox!.nativeElement.scrollTo({
      top:0,
      behavior:'smooth'
    })
  }
}
