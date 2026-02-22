import { Component, output, signal, OnInit } from '@angular/core';

const CLAUDE_KEY = 'devstream_claude_api_key';
const OPENAI_KEY = 'devstream_openai_api_key';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
  host: { '(keydown.escape)': 'close.emit()' },
})
export class SettingsPanelComponent implements OnInit {
  readonly close = output<void>();

  readonly claudeKeyInput = signal('');
  readonly showClaudeKey = signal(false);

  readonly openaiKeyInput = signal('');
  readonly showOpenAiKey = signal(false);

  readonly saved = signal(false);

  ngOnInit(): void {
    const claude = localStorage.getItem(CLAUDE_KEY) ?? '';
    this.claudeKeyInput.set(claude ? '•'.repeat(16) : '');

    const openai = localStorage.getItem(OPENAI_KEY) ?? '';
    this.openaiKeyInput.set(openai ? '•'.repeat(16) : '');
  }

  get isClaudeKeySet(): boolean {
    return !!localStorage.getItem(CLAUDE_KEY);
  }

  get isOpenAiKeySet(): boolean {
    return !!localStorage.getItem(OPENAI_KEY);
  }

  onClaudeInput(event: Event): void {
    this.claudeKeyInput.set((event.target as HTMLInputElement).value);
    this.saved.set(false);
  }

  onOpenAiInput(event: Event): void {
    this.openaiKeyInput.set((event.target as HTMLInputElement).value);
    this.saved.set(false);
  }

  toggleShowClaudeKey(): void {
    this.showClaudeKey.update((v) => !v);
    const real = localStorage.getItem(CLAUDE_KEY) ?? '';
    this.claudeKeyInput.set(this.showClaudeKey() && real ? real : real ? '•'.repeat(16) : '');
  }

  toggleShowOpenAiKey(): void {
    this.showOpenAiKey.update((v) => !v);
    const real = localStorage.getItem(OPENAI_KEY) ?? '';
    this.openaiKeyInput.set(this.showOpenAiKey() && real ? real : real ? '•'.repeat(16) : '');
  }

  clearClaudeKey(): void {
    localStorage.removeItem(CLAUDE_KEY);
    this.claudeKeyInput.set('');
    this.saved.set(false);
  }

  clearOpenAiKey(): void {
    localStorage.removeItem(OPENAI_KEY);
    this.openaiKeyInput.set('');
    this.saved.set(false);
  }

  save(): void {
    const claudeVal = this.claudeKeyInput().trim();
    if (!/^•+$/.test(claudeVal)) {
      if (claudeVal) localStorage.setItem(CLAUDE_KEY, claudeVal);
      else localStorage.removeItem(CLAUDE_KEY);
    }

    const openaiVal = this.openaiKeyInput().trim();
    if (!/^•+$/.test(openaiVal)) {
      if (openaiVal) localStorage.setItem(OPENAI_KEY, openaiVal);
      else localStorage.removeItem(OPENAI_KEY);
    }

    this.saved.set(true);
    setTimeout(() => this.close.emit(), 800);
  }
}
