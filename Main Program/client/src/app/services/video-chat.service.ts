import { inject, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VideoChatService {

  private hubUrl = "http://localhost:5293/hubs/video";
  public hubConnection!: HubConnection;

  public incomingCall = false;

  public isCallActive = false;

  public remoteUserId = '';

  public peerConnection!:RTCPeerConnection;

  public offerReceived = new BehaviorSubject<{senderId: string, offer:RTCSessionDescriptionInit} |null> (null);
  public answerReceived = new BehaviorSubject<{senderId: string, answer:RTCSessionDescription} |null> (null);
  public iceCandidateReceived = new BehaviorSubject<{senderId: string, candidate:RTCIceCandidate} |null> (null);


  private authService = inject(AuthService);

  async startConnection(){
    
    this.hubConnection = new HubConnectionBuilder().
    withUrl(this.hubUrl,{
      accessTokenFactory:()=> this.authService.getAccessToken!
    }).withAutomaticReconnect()
    .build();


    await this.hubConnection.start().catch((err)=> console.error("SignalRConnectionError",err));

    this.hubConnection.on("ReceiveOffer", (senderId,offer)=> {
      this.offerReceived.next({senderId,offer:JSON.parse(offer)});
    })

   this.hubConnection.on("ReceiveAnswer", (senderId,answer)=> {
      this.answerReceived.next({senderId,answer:JSON.parse(answer)});
    })


    this.hubConnection.on("ReceiveIceCandidate", (senderId,candidate)=> {
      this.iceCandidateReceived.next({senderId,candidate:JSON.parse(candidate)});
    })

  }

  sendOffer(receiverId: string, offer:RTCSessionDescriptionInit){
    this.hubConnection.invoke("SendOffer", receiverId, JSON.stringify(offer));
  }

   sendAnswer(receiverId: string, answer:RTCSessionDescriptionInit){
    this.hubConnection.invoke("SendAnswer", receiverId, JSON.stringify(answer));
  }
   sendIceCandidate(receiverId: string, candidate:RTCIceCandidate){
    this.hubConnection.invoke("SendIceCandidate", receiverId, JSON.stringify(candidate));
  }

   sendEndCall(receiverId: string){
    this.hubConnection.invoke("EndCall", receiverId);
  }
}
