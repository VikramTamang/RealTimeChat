import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { AuthComponent } from './features/auth/auth.component';
import { ChatComponent } from './features/chat/chat.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'login',
    component: AuthComponent
  },
  {
    path: 'register',
    component: AuthComponent
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
