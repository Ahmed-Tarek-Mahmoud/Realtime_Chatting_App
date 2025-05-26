import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  NgZone,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ChatBoxComponent } from '../chat-box/chat-box.component';
import { EmojiModule } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { VideoChatService } from '../../services/video-chat.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { VideoChatComponent } from '../../video-chat/video-chat.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule,TitleCasePipe, MatIconModule, FormsModule, ChatBoxComponent,EmojiModule],
  templateUrl: './chat-window.component.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChatWindowComponent {
  @ViewChild('chatBox') chatContainer?: ElementRef;
  dialog = inject(MatDialog);


  toggled: boolean = false;
  chatService = inject(ChatService);
  signalRService = inject(VideoChatService);
  message: string = '';
  private ngZone = inject(NgZone);

  sendMessage() {
    if (!this.message.trim()) return;
    this.chatService.sendMessage(this.message);
    this.message = '';
    this.scrollToBottom();
  }

  handleSelection(event : any) {
  const emoji = event.emoji.native;
  this.message += emoji;
 
  }


  displayDialog(receiverId : string){
    this.signalRService.remoteUserId = receiverId;

    this.dialog.open(VideoChatComponent,{
      width : "400px",
      height: "600px",
      disableClose:true,
      autoFocus:false
    })
  }

  private scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    }
  }

}

