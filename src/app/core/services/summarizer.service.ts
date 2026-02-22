import { Injectable } from '@angular/core';

// Placeholder — full implementation in Step 4
@Injectable({ providedIn: 'root' })
export class SummarizerService {
  private readonly cache = new Map<string, string>();

  getCached(url: string): string | undefined {
    return this.cache.get(url);
  }
}
