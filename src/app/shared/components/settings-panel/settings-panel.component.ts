import { Component, OnInit, output, signal } from '@angular/core';

import {
  CLAUDE_KEY,
  DEFAULT_SUMMARIZER_MODE,
  isSummarizerMode,
  OPENAI_KEY,
  SummarizerMode,
  SUMMARIZER_MODE_KEY,
} from '../../../core/constants/summarizer.constants';

type SummarizerModeOption = {
  value: SummarizerMode;
  label: string;
  description: string;
};

const MODE_OPTIONS: ReadonlyArray<SummarizerModeOption> = [
  {
    value: 'offline',
    label: 'Offline',
    description: 'Runs fully in the browser with no API key.',
  },
  {
    value: 'claude',
    label: 'Claude',
    description: 'Uses your Anthropic API key for cloud summaries.',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'Uses your OpenAI API key for cloud summaries.',
  },
];

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.scss',
  host: { '(keydown.escape)': 'close.emit()' },
})
export class SettingsPanelComponent implements OnInit {
  readonly close = output<void>();

  readonly modeOptions = MODE_OPTIONS;
  readonly summarizerMode = signal<SummarizerMode>(DEFAULT_SUMMARIZER_MODE);

  readonly claudeKeyInput = signal('');
  readonly showClaudeKey = signal(false);

  readonly openaiKeyInput = signal('');
  readonly showOpenAiKey = signal(false);

  readonly saved = signal(false);

  ngOnInit(): void {
    const storedMode = localStorage.getItem(SUMMARIZER_MODE_KEY);
    this.summarizerMode.set(
      isSummarizerMode(storedMode) ? storedMode : DEFAULT_SUMMARIZER_MODE,
    );

    const claude = localStorage.getItem(CLAUDE_KEY) ?? '';
    this.claudeKeyInput.set(claude ? '*'.repeat(16) : '');

    const openai = localStorage.getItem(OPENAI_KEY) ?? '';
    this.openaiKeyInput.set(openai ? '*'.repeat(16) : '');
  }

  get isClaudeKeySet(): boolean {
    return !!localStorage.getItem(CLAUDE_KEY);
  }

  get isOpenAiKeySet(): boolean {
    return !!localStorage.getItem(OPENAI_KEY);
  }

  setMode(mode: SummarizerMode): void {
    this.summarizerMode.set(mode);
    this.saved.set(false);
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
    this.claudeKeyInput.set(this.showClaudeKey() && real ? real : real ? '*'.repeat(16) : '');
  }

  toggleShowOpenAiKey(): void {
    this.showOpenAiKey.update((v) => !v);
    const real = localStorage.getItem(OPENAI_KEY) ?? '';
    this.openaiKeyInput.set(this.showOpenAiKey() && real ? real : real ? '*'.repeat(16) : '');
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
    localStorage.setItem(SUMMARIZER_MODE_KEY, this.summarizerMode());

    const claudeVal = this.claudeKeyInput().trim();
    if (!/^\*+$/.test(claudeVal)) {
      if (claudeVal) localStorage.setItem(CLAUDE_KEY, claudeVal);
      else localStorage.removeItem(CLAUDE_KEY);
    }

    const openaiVal = this.openaiKeyInput().trim();
    if (!/^\*+$/.test(openaiVal)) {
      if (openaiVal) localStorage.setItem(OPENAI_KEY, openaiVal);
      else localStorage.removeItem(OPENAI_KEY);
    }

    this.saved.set(true);
    setTimeout(() => this.close.emit(), 800);
  }
}
