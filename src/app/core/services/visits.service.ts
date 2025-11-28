import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Visit, CreateVisitDto, VisitStatus } from '../models/visitor.model';
import { environment } from '../../../environments/environment';

/**
 * Servicio para gestión de visitas
 */
@Injectable({
  providedIn: 'root'
})
export class VisitsService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/visitas`;

  /**
   * Crear nueva visita
   */
  createVisit(visitData: CreateVisitDto): Observable<Visit> {
    return this.http.post<Visit>(`${this.API_URL}`, visitData);
  }

  /**
   * Crear visita preautorizada
   */
  crearVisitaPreautorizada(visitaData: {
    visitante: {
      dni: number;
      nombre: string;
      apellido: string;
      empresa?: string;
      email: string;
    };
    motivo: string;
    id_anfitrion: number;
    inicio: string;
    fin: string;
    id_usuario: number | null;
  }, idPerfil: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}`, visitaData, {
      headers: {
        'id-perfil': idPerfil.toString()
      }
    });
  }

  /**
   * Crear visita inesperada
   */
  crearVisitaInesperada(visitaData: {
    visitante: {
      dni: number;
      nombre: string;
      apellido: string;
      empresa?: string;
      email: string;
    };
    motivo: string;
    id_anfitrion: number;
    inicio: string;
    fin: string;
    id_usuario: number | null;
  }, idPerfil: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}`, visitaData, {
      headers: {
        'id-perfil': idPerfil.toString()
      }
    });
  }

  /**
   * Obtener visitas del anfitrion/autorizante
   */
  obtenerVisitasAnfitrion(idUsuario: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/anfitrion/${idUsuario}`);
  }

  /**
   * Marcar check-in (ingreso) de una visita
   */
  marcarCheckIn(idVisita: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/checkin/${idVisita}`, {});
  }

  /**
   * Marcar check-out (salida) de una visita
   */
  marcarCheckOut(idVisita: number): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/checkout/${idVisita}`, {});
  }

  /**
   * Aprobar una visita
   */
  aprobarVisita(idVisitante: number): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${idVisitante}`, {
      estado: 'aprobado'
    });
  }

  /**
   * Rechazar una visita
   */
  rechazarVisita(idVisitante: number): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${idVisitante}`, {
      estado: 'rechazado'
    });
  }

  /**
   * Obtener todas las visitas con filtros opcionales
   */
  getVisits(filters?: {
    status?: VisitStatus;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Observable<Visit[]> {
    let params = new HttpParams();

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<Visit[]>(this.API_URL, { params });
  }

  /**
   * Obtener visita por ID
   */
  getVisitById(id: string): Observable<Visit> {
    return this.http.get<Visit>(`${this.API_URL}/${id}`);
  }

  /**
   * Check-in mediante QR
   */
  checkInByQr(qrCode: string): Observable<Visit> {
    return this.http.post<Visit>(`${this.API_URL}/check-in/qr`, { qrCode });
  }

  /**
   * Check-out de visita
   */
  checkOut(visitId: string): Observable<Visit> {
    return this.http.patch<Visit>(`${this.API_URL}/${visitId}/check-out`, {});
  }

  /**
   * Cancelar visita
   */
  cancelVisit(visitId: string, reason: string): Observable<Visit> {
    return this.http.patch<Visit>(`${this.API_URL}/${visitId}/cancel`, { reason });
  }
}
