import { GenericSetting, Setting, SettingsService } from '../../services/settings.service';
import { Component } from '@angular/core';
import { DEFAULT_COMPONENT_CONFIG } from '../../constants/APP_COMPONENT';

@Component({
  ...DEFAULT_COMPONENT_CONFIG,
  selector: 'settings',
  imports: [],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  protected readonly Array = Array;

  private readonly validNumericInputKeys = ['Backspace', 'Delete'];
  private readonly validNumericModifiers = ['a', 'x', 'v', 'y', 'z'];

  constructor(protected readonly settingsService: SettingsService) {
    for (let i = 0; i < 10; i++) {
      this.validNumericInputKeys.push(i.toString());
    }
  }

  protected preventInvalidNumerics($event: KeyboardEvent) {
    if (this.validNumericInputKeys.includes($event.key)) {
      return true;
    }

    if (this.validNumericModifiers.includes($event.key) && $event.ctrlKey) {
      return true;
    }

    $event.preventDefault();
    return false;
  }

  protected dispatchValue($event: Event, setting: GenericSetting) {
    if (!($event.target instanceof HTMLInputElement)) {
      return;
    }

    if (
      $event.target.type === 'number' &&
      $event instanceof KeyboardEvent &&
      this.preventInvalidNumerics($event)
    ) {
      return;
    }

    const value = $event.target.value;
    switch (typeof setting.get()) {
      case 'object': {
        setting.set(JSON.parse(value) as never);
        break;
      }
      case 'string': {
        setting.set(value as never);
        break;
      }
      case 'number': {
        setting.set(Number(value) as never);
        break;
      }
      case 'boolean': {
        if ($event.target.type === 'checkbox') {
          setting.set($event.target.checked as never);
          break;
        }

        break;
      }
    }
  }

  protected addNewSettingEntry(sett: GenericSetting) {
    const value = sett.get();
    if (typeof value !== 'object') {
      return;
    }

    if (!Array.isArray(value)) {
      return;
    }

    sett.set([...value, ''] as never);
  }

  protected removeSettingEntry(sett: GenericSetting, index: number) {
    const copy = [...sett.asArray()];
    copy.splice(index, 1);
    sett.set(copy as never);
  }

  protected handleInput(sett: GenericSetting, $index: number, $event: InputEvent) {
    const copy = [...sett.asArray()];
    if ($event.currentTarget instanceof HTMLInputElement) {
      copy[$index] = $event.currentTarget.value;
      sett.set(copy as never);
    }
  }
}
