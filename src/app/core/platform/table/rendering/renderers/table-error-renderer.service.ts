import { Injectable } from '@angular/core';
import { TableErrorConfig, TableErrorNode } from '../rendering.types';

@Injectable({ providedIn: 'root' })
export class TableErrorRendererService {

  buildErrorNode(
    error:   string | Error | TableErrorConfig,
    details?: string,
  ): TableErrorNode {
    if (typeof error === 'string') {
      return {
        type:    'error',
        id:      'error-state',
        visible: true,
        message: error,
        details,
      };
    }

    if (error instanceof Error) {
      return {
        type:    'error',
        id:      'error-state',
        visible: true,
        message: error.message,
        details: error.stack,
      };
    }

    return {
      type:    'error',
      id:      'error-state',
      visible: true,
      message: error.message,
      details: error.details,
    };
  }

  fromHttpStatus(status: number, statusText?: string): TableErrorNode {
    const messages: Record<number, string> = {
      401: 'Unauthorized — please log in to view this table.',
      403: 'Access denied — you do not have permission to view this data.',
      404: 'Data not found.',
      500: 'Server error — please try again later.',
    };
    return this.buildErrorNode(messages[status] ?? statusText ?? `HTTP ${status}`);
  }
}
