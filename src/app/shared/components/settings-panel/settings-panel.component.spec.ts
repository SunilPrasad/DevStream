import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import {
  CLAUDE_KEY,
  OPENAI_KEY,
  SUMMARIZER_MODE_KEY,
} from '../../../core/constants/summarizer.constants';
import { SettingsPanelComponent } from './settings-panel.component';

describe('SettingsPanelComponent', () => {
  function createComponent(): SettingsPanelComponent {
    const fixture = TestBed.createComponent(SettingsPanelComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SettingsPanelComponent],
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('defaults summarizer mode to offline', () => {
    const component = createComponent();

    expect(component.summarizerMode()).toBe('offline');
  });

  it('restores saved summarizer mode from localStorage', () => {
    localStorage.setItem(SUMMARIZER_MODE_KEY, 'openai');

    const component = createComponent();

    expect(component.summarizerMode()).toBe('openai');
  });

  it('persists selected summarizer mode on save', () => {
    const component = createComponent();

    component.setMode('claude');
    component.save();

    expect(localStorage.getItem(SUMMARIZER_MODE_KEY)).toBe('claude');
  });

  it('saves API keys alongside summarizer mode', () => {
    const component = createComponent();

    component.setMode('openai');
    component.claudeKeyInput.set('sk-ant-123');
    component.openaiKeyInput.set('sk-openai-123');
    component.save();

    expect(localStorage.getItem(SUMMARIZER_MODE_KEY)).toBe('openai');
    expect(localStorage.getItem(CLAUDE_KEY)).toBe('sk-ant-123');
    expect(localStorage.getItem(OPENAI_KEY)).toBe('sk-openai-123');
  });
});
