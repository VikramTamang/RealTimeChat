import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { ChatComponent } from './features/chat/chat.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: AuthComponent
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'chat'
  }
];
