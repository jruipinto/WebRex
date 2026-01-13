import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiResponse } from 'src/shared';

export abstract class AbstractApiService<T> {
  private readonly http = inject(HttpClient);
  protected readonly API_PREFIX = '/webrex-api';
  protected readonly API_PATH = `${this.API_PREFIX}/servicename`;

  /** Find documents macthing criteria
   *
   * (criteria isn't implemented yet, so it works as a "get all", for the moment)
   */
  search() {
    return this.http.get<ApiResponse<T>>(this.API_PATH);
  }
  /** Get document by id */
  get(id: string) {
    return this.http.get<ApiResponse<T>['result'][0]>(`${this.API_PATH}/${id}`);
  }
  /** Create new document */
  create(payload: T) {
    return this.http.post<T>(this.API_PATH, payload);
  }
  /** Replace document */
  update(id: string, payload: T) {
    return this.http.put<T>(`${this.API_PATH}/${id}`, payload);
  }
  /** Patch document */
  patch(id: string, payload: T) {
    return this.http.patch<T>(`${this.API_PATH}/${id}`, payload);
  }
  /** Delete document by id or all if id is `*` */
  delete(id: string) {
    return this.http.delete<T>(`${this.API_PATH}/${id}`);
  }
}
