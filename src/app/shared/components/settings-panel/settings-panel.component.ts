import { Component, output, signal, OnInit } from '@angular/core';

const API_KEY_STORAGE_KEY = 'devstream_claude_api_key';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
  host: { '(keydown.escape)': 'close.emit()' },
})
export class SettingsPanelComponent implements OnInit {
  readonly close = output<void>();

  readonly apiKeyInput = signal('');
  readonly showKey = signal(false);
  readonly saved = signal(false);

  ngOnInit(): void {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
    // Show masked value if key is already set
    this.apiKeyInput.set(stored ? '•'.repeat(16) : '');
  }

  get isKeySet(): boolean {
    return !!localStorage.getItem(API_KEY_STORAGE_KEY);
  }

  onInput(event: Event): void {
    this.apiKeyInput.set((event.target as HTMLInputElement).value);
    this.saved.set(false);
  }

  save(): void {
    const val = this.apiKeyInput().trim();
    // If the value looks like masked bullets the user didn't change it — keep existing
    if (/^•+$/.test(val)) {
      this.close.emit();
      return;
    }
    if (val) {
      localStorage.setItem(API_KEY_STORAGE_KEY, val);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    this.saved.set(true);
    setTimeout(() => this.close.emit(), 800);
  }

  clearKey(): void {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    this.apiKeyInput.set('');
    this.saved.set(false);
  }

  toggleShowKey(): void {
    this.showKey.update((v) => !v);
    // Reveal real key (if set) when user toggles
    const real = localStorage.getItem(API_KEY_STORAGE_KEY) ?? '';
    this.apiKeyInput.set(this.showKey() && real ? real : real ? '•'.repeat(16) : '');
  }
}
