import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatInputModule , MatIconModule , FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email!: string;
  password!:string;
  hide = signal(false);

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  login() { 
    this.authService.login(this.email , this.password).subscribe({
      next: () => {
        this.authService.me().subscribe();
        this.snackBar.open('Login Successful' , 'Close', {
          duration: 1000,
        });

      },
      error:(err:HttpErrorResponse) => {
        let error = err.error as ApiResponse<string>;
        this.snackBar.open(error.error, "Close" , {
          duration: 3000,
        });
      },
      complete:() => {
        this.router.navigate(['/']);
      }
    })
  }

  togglePassword(event : MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
}
