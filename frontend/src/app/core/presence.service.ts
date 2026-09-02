import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { PresenceInfo } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private apiUrl = '/api/presence';
  private heartbeatSubscription?: Subscription;

  // Signal storing userId -> 'ONLINE' | 'OFFLINE'
  presenceMap = signal<Record<string, 'ONLINE' | 'OFFLINE'>>({});

  constructor(private http: HttpClient, private authService: AuthService) {}

  startHeartbeat(): void {
    this.stopHeartbeat();
    // Send immediate heartbeat
    this.sendHeartbeat().subscribe();

    // Send heartbeat every 15 seconds (well within the 30s Redis TTL)
    this.heartbeatSubscription = interval(15000).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.sendHeartbeat().subscribe({
          error: (err) => console.debug('Heartbeat error:', err)
        });
      }
    });
  }

  stopHeartbeat(): void {
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.unsubscribe();
      this.heartbeatSubscription = undefined;
    }
  }

  sendHeartbeat(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/heartbeat`, {});
  }

  fetchBatchPresence(userIds: string[]): Observable<Record<string, 'ONLINE' | 'OFFLINE'>> {
    return this.http.post<Record<string, 'ONLINE' | 'OFFLINE'>>(`${this.apiUrl}/batch`, userIds);
  }

  updatePresenceStatus(userId: string, status: 'ONLINE' | 'OFFLINE'): void {
    this.presenceMap.update(map => ({
      ...map,
      [userId]: status
    }));
  }

  isUserOnline(userId: string): boolean {
    return this.presenceMap()[userId] === 'ONLINE';
  }
}
