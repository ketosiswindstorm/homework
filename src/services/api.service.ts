import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class APIService {
  private readonly prefix: string;
  private readonly apiString: string;

  constructor(private readonly settingsService: SettingsService) {
    this.apiString = `api_key=${this.settingsService.r34APIKey.get()}&user_id=${this.settingsService.r34UID.get()}&`;
    this.prefix = `https://api.rule34.xxx/index.php?page=dapi&${this.apiString}`;
  }

  public getPostURL() {
    return `${this.prefix}s=post&q=index&json=1&limit=${this.settingsService.postsPerPage.get()}`;
  }

  public getTagURL(tag: string) {
    return `${this.prefix}s=tag&q=index&limit=20&name=${tag}`;
  }

  public getAutoCompleteURL(input: string) {
    return `https://api.rule34.xxx/autocomplete.php?q=${input}&${this.apiString}`;
  }
}
