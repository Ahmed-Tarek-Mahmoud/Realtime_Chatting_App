import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


private baseUrl = 'http://localhost:5293/api/account';

  private httpClient = inject(HttpClient);
  private token = "token";

  register(data:FormData):Observable<ApiResponse<string>> { 
    return this.httpClient
    .post<ApiResponse<string>>(`${this.baseUrl}/register` , data)
      .pipe(tap((response) => {
          localStorage.setItem(this.token , response.data)
    }))
  }

  login(email:string , password:string):Observable<ApiResponse<string>> {
    return this.httpClient
    .post<ApiResponse<string>>(`${this.baseUrl}/login` , {email , password})
      .pipe(tap((response) => {
        if(response.isSuccess)
          localStorage.setItem(this.token , response.data)
        return response;
    }))
  }

  me() : Observable<ApiResponse<User>>{
    return this.httpClient.get<ApiResponse<User>>(`${this.baseUrl}/me` , {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken}`
      },
    })
    .pipe(tap((response) => {
      if(response.isSuccess){
        localStorage.setItem("user" , JSON.stringify(response.data))
      }

    }))
  }

  get getAccessToken(): string|null {
    return localStorage.getItem(this.token) || '';
  }

  isLoggedIn() : boolean {
    return !!localStorage.getItem(this.token);
  }

  logout() {
  
    localStorage.removeItem(this.token);
    localStorage.removeItem('user');
  }

  get currentLoggedInUser() : User | null{
    const user :User = JSON.parse(localStorage.getItem('user') || '{}');
    return user;
  }
}
