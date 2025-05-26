import { Component, ElementRef, inject, ViewChild, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { VideoChatService } from '../services/video-chat.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-video-chat',
  imports: [MatIconModule],
  template: `
  <div class="relative h-full w-full">
      <video class ="w-32 absolute right-5 top-4 h-52 object-cover border-red-500 border-2 rounded-lg"
      #localVideo autoplay playsInLine> </video>
      <video class ="w-full h-full object-cover bg-slate-800"
      #remoteVideo autoplay playsInLine> </video>

      <div class="absolute bottom-10 left-0 right-0 z-50 flex justify-center space-x-3 p-4">
      @if(signalRService.incomingCall){
      <button
        class = "bg-green-500 flex items-center gap-2 hover:bg-gray-700
        shadow-xl text-white font-bold py-2 px-4 rounded-full"
        (click) = "acceptCall()">
            <mat-icon>
              call
          </mat-icon>
          Accept
        </button>

        <button
        class = "bg-red-500 flex items-center gap-2 hover:bg-red-700
        shadow-xl text-white font-bold py-2 px-4 rounded-full"
        (click) = "declineCall()">
            <mat-icon>
              call_end
          </mat-icon>
          Decline
        </button>
        }

        @if(!signalRService.incomingCall && !this.signalRService.isCallActive ){
          <button
        class = "bg-green-500 flex items-center gap-2 hover:bg-gray-700
        shadow-xl text-white font-bold py-2 px-4 rounded-full"
        (click) = "startCall()">
            <mat-icon>
              call
          </mat-icon>
          Start Call
        </button>
        }

        @if(!this.signalRService.incomingCall){
              <button
        class = "bg-red-500 flex items-center gap-2 hover:bg-red-700
        shadow-xl text-white font-bold py-2 px-4 rounded-full"
        (click) = "endCall()">
            <mat-icon>
              call_end
          </mat-icon>
          End Call
        </button>

        }
       
      </div>
  </div>
  `,
  styles: ``
})
export class VideoChatComponent {
  @ViewChild("localVideo") localVideo!:ElementRef<HTMLVideoElement>;
  @ViewChild("remoteVideo") remoteVideo!:ElementRef<HTMLVideoElement>;



  private peerConnection!:RTCPeerConnection;
  signalRService = inject(VideoChatService);
  private dialogRef : MatDialogRef<VideoChatComponent> = inject(MatDialogRef);
  
  async ngOnInit(): Promise<void>{
    await this.setupPeerConnection();
    this.startLocalVideo();
    await this.signalRService.startConnection();
    this.setupSignalListers();
  }

  setupSignalListers(){
    this.signalRService.hubConnection.on('CallEnded', ()=> {
      //
    })

    this.signalRService.answerReceived.subscribe(async(data) => {
      if(data){
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
      }
    });

    this.signalRService.iceCandidateReceived.subscribe(async(data)=> {
      if(data){
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
      }

    })
  }


  declineCall(){
    this.signalRService.incomingCall = false;
    this.signalRService.isCallActive = false;
    this.signalRService.sendEndCall(this.signalRService.remoteUserId);
    this.dialogRef.close();
  }

  async acceptCall(){
    this.signalRService.incomingCall = false;
    this.signalRService.isCallActive = true;

    let offer = await this.signalRService.offerReceived.getValue()?.offer;

    if(offer){
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      let answer = await this.peerConnection.createAnswer();

      await this.peerConnection.setLocalDescription(answer);

      this.signalRService.sendAnswer(this.signalRService.remoteUserId, answer);
    }
  }


  async startCall(){
    this.signalRService.isCallActive = true;

    let offer = await this.peerConnection.createOffer();

    await this.peerConnection.setLocalDescription(offer);

    this.signalRService.sendOffer(this.signalRService.remoteUserId, offer);
  }

  setupPeerConnection(){
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{urls:'stun:stun.l.google.com:19302'},{
        urls:'stun:stun.services.mozilla.com'
      }]
    });

    this.peerConnection.onicecandidate = (event) => {
      if(event.candidate){
        this.signalRService.sendIceCandidate(this.signalRService.remoteUserId, event.candidate);
      }
    }

    this.peerConnection.ontrack = (event) => {
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    }
  }

  async startLocalVideo(){
    const stream = await navigator.mediaDevices.getUserMedia({
      video:true,
      audio:true
    });

    this.localVideo.nativeElement.srcObject = stream;

    stream.getTracks().forEach((track) => this.peerConnection.addTrack(track,stream));
  }

  async endCall(){
    if(this.peerConnection){
      this.dialogRef.close();
      this.signalRService.isCallActive = false;
      this.signalRService.incomingCall = false;
      this.signalRService.remoteUserId = '';
      this.peerConnection.close();
      this.peerConnection = new RTCPeerConnection();

      this.localVideo.nativeElement.srcObject = null;
    }

    const stream = this.localVideo.nativeElement.srcObject as MediaStream;

    if(stream) {
      stream.getTracks().forEach((track)=> track.stop());

      this.localVideo.nativeElement.srcObject = null;
    }

    this.signalRService.sendEndCall(this.signalRService.remoteUserId);
  }
}
