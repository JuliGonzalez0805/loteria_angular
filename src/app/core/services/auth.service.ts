import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse, UserRole } from '../models/visitor.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio de autenticación usando Signals
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  // Signals para manejo de estado
  private readonly tokenSignal = signal<string | null>(
    localStorage.getItem('auth_token')
  );
  
  private readonly userSignal = signal<User | null>(
    JSON.parse(localStorage.getItem('current_user') || 'null')
  );

  // Computed signals
  readonly currentUser = computed(() => this.userSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

  /**
   * Login de usuario
   */
  login(dni: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, {
      dni,
      pass: password
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Decodificar el token JWT para obtener la información del usuario
          const tokenPayload = this.decodeToken(response.data);
          
          // Usar 'perfil' del backend para determinar el rol
          const userRole = this.mapRole(tokenPayload.perfil || tokenPayload.rol);
          
          const authResponse: AuthResponse = {
            token: response.data,
            user: {
              id: tokenPayload.id || tokenPayload._id,
              username: tokenPayload.usuario || dni,
              email: tokenPayload.correo || tokenPayload.email || '',
              role: userRole,
              fullName: `${tokenPayload.nombre || ''} ${tokenPayload.apellido || ''}`.trim() || 'Usuario',
              active: true,
              idPerfil: tokenPayload.id_perfil
            },
            expiresIn: 3600
          };
          
          this.setSession(authResponse);
        }
      })
    );
  }

  /**
   * Decodificar token JWT (sin verificación, solo para obtener el payload)
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return {};
    }
  }

  /**
   * Mapear rol del backend al enum UserRole
   * Si no es RECEPCIONISTA, se considera AUTORIZANTE
   */
  private mapRole(backendRole: string): UserRole {
    const normalizedRole = backendRole?.toUpperCase();
    
    // Si es recepcionista, asignar ese rol
    if (normalizedRole === 'RECEPCIONISTA') {
      return UserRole.RECEPCIONISTA;
    }
    
    // Cualquier otro perfil se considera AUTORIZANTE
    return UserRole.AUTORIZANTE;
  }

  /**
   * Obtener la ruta de redirección según el rol del usuario
   */
  getRedirectUrlByRole(role: UserRole): string {
    const redirectMap: { [key: string]: string } = {
      [UserRole.AUTORIZANTE]: '/detalles',
      [UserRole.RECEPCIONISTA]: '/detalles',
      [UserRole.ADMIN]: '/admin/dashboard',
      [UserRole.SUPERVISOR]: '/admin/dashboard',
      [UserRole.GUARDIA]: '/detalles'
    };
    return redirectMap[role] || '/detalles';
  }

  /**
   * Logout y limpieza de sesión
   */
  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Guardar sesión
   */
  private setSession(authResult: AuthResponse): void {
    this.tokenSignal.set(authResult.token);
    this.userSignal.set(authResult.user);
    localStorage.setItem('auth_token', authResult.token);
    localStorage.setItem('current_user', JSON.stringify(authResult.user));
  }
}
