import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/visitor.model';

/**
 * Guard funcional para validar roles de usuario
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];
  const userRole = authService.currentUser()?.role;

  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  // Redirigir a kiosco si no tiene permisos
  router.navigate(['/kiosco']);
  return false;
};
