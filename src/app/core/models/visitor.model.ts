/**
 * Modelo de visitante con información personal
 */
export interface Visitor {
  id?: string;
  dni: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  photoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Modelo de visita con información del registro
 */
export interface Visit {
  id?: string;
  visitorId: string;
  visitor?: Visitor;
  purpose: string;
  hostName: string;
  hostArea: string;
  checkInTime: Date;
  checkOutTime?: Date;
  status: VisitStatus;
  qrCode?: string;
  notes?: string;
  createdBy: string;
  updatedAt?: Date;
}

export enum VisitStatus {
  PENDING = 'PENDING',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED'
}

/**
 * DTO para crear una nueva visita
 */
export interface CreateVisitDto {
  visitor: Omit<Visitor, 'id' | 'createdAt' | 'updatedAt'>;
  purpose: string;
  hostName: string;
  hostArea: string;
  notes?: string;
}

/**
 * Modelo de usuario del sistema
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  active: boolean;
  idPerfil?: number;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  GUARDIA = 'GUARDIA',
  SUPERVISOR = 'SUPERVISOR',
  RECEPCIONISTA = 'RECEPCIONISTA',
  AUTORIZANTE = 'AUTORIZANTE'
}

/**
 * Response de autenticación
 */
export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}
