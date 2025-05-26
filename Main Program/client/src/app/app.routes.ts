import { Routes } from '@angular/router';
import { loginGuard } from './guards/login.guard';
import { ChatComponent } from './chat/chat.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'register',
        loadComponent: () =>
            import("./register/register.component").then((x) => x.RegisterComponent),
        canActivate: [loginGuard],
    },
    {
        path: 'login',
        loadComponent: () =>
            import("./login/login.component").then((x) => x.LoginComponent),
        canActivate: [loginGuard],
    },
    {
        path: 'chat',
        component: ChatComponent,
        canActivate: [authGuard],
    },
    {
        path: '**', // Wildcard route
        redirectTo: 'chat',
        pathMatch: 'full',
    }
];
