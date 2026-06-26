import { Injectable, Service } from '@angular/core';

function getLSValue(key: string, fallback = '') {
  return localStorage.getItem(key) || fallback;
}

function setLSValue(key: string, value: any) {
  localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
}

export class Setting<T> {
  private value: T;

  constructor(
    private readonly localStorageKey: string,
    fallback: T,
    private label: string,
  ) {
    const raw = getLSValue(localStorageKey);
    if (raw === '') {
      this.value = fallback;
      setLSValue(localStorageKey, fallback);
      return;
    }

    switch (typeof fallback) {
      case 'string': {
        this.value = raw as T;
        break;
      }
      case 'number': {
        const parsed = Number(raw);
        if (isNaN(parsed)) {
          this.value = fallback;
        } else {
          this.value = parsed as T;
        }

        break;
      }
      case 'boolean': {
        if (raw === 'true') {
          this.value = true as T;
          break;
        }

        if (raw === 'false') {
          this.value = false as T;
          break;
        }

        this.value = fallback;
        break;
      }
      case 'object': {
        try {
          this.value = JSON.parse(raw) as T;
        } catch {
          this.value = fallback;
        }

        break;
      }
      default: {
        throw new Error('Invalid setting value');
      }
    }
  }

  public asArray(): string[]{
    return this.value as string[];
  }

  public getLabel(): string {
    return this.label;
  }

  public get() {
    return this.value;
  }

  public set(value: T) {
    this.value = value;
    setLSValue(this.localStorageKey, value);
  }
}

export type GenericSetting = Setting<string> | Setting<number> | Setting<boolean> | Setting<object>;

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly LS_PREF = 'R34V3_';
  private readonly GH_API_KEY = `${this.LS_PREF}GITHUB_API_KEY`;
  private readonly R34_API_KEY = `${this.LS_PREF}R34_API_KEY`;
  private readonly R34_UID_KEY = `${this.LS_PREF}R34_UID_KEY`;
  private readonly LOOP_ENABLED = `${this.LS_PREF}LOOP_ENABLED`;
  private readonly AUTOLOAD_POSTS = `${this.LS_PREF}AUTOLOAD_POSTS`;
  private readonly POSTS_PER_PAGE = `${this.LS_PREF}POSTS_PER_PAGE`;
  private readonly CLEAR_AFTER_SELECT_TAG = `${this.LS_PREF}CLEAR_AFTER_SELECT_TAG`;
  private readonly TAG_BLACKLIST = `${this.LS_PREF}TAG_BLACKLIST`;

  public readonly githubAPIKey: Setting<string>;
  public readonly r34APIKey: Setting<string>;
  public readonly r34UID: Setting<number>;
  public readonly loopEnabled: Setting<boolean>;
  public readonly autoloadMorePosts: Setting<boolean>;
  public readonly postsPerPage: Setting<number>;
  public readonly clearAfterSelectTag: Setting<boolean>;
  public readonly tagBlacklist: Setting<Array<string>>;

  constructor() {
    this.githubAPIKey = new Setting<string>(this.GH_API_KEY, '', 'GitHub API Key');
    this.r34APIKey = new Setting<string>(this.R34_API_KEY, '', 'R34 API Key');
    this.r34UID = new Setting<number>(this.R34_UID_KEY, 0, 'R34 User ID');
    this.loopEnabled = new Setting<boolean>(this.LOOP_ENABLED, false, 'Loop Enabled');
    this.autoloadMorePosts = new Setting<boolean>(this.AUTOLOAD_POSTS, false, 'Autoload Posts');
    this.postsPerPage = new Setting<number>(this.POSTS_PER_PAGE, 50, 'Posts Per Page');
    this.tagBlacklist = new Setting<Array<string>>(this.TAG_BLACKLIST, [], 'Tag Blacklist');

    this.clearAfterSelectTag = new Setting<boolean>(
      this.CLEAR_AFTER_SELECT_TAG,
      true,
      'Clear After Select Tag',
    );
  }

  public getSettings() {
    return Object.entries(Object.getOwnPropertyDescriptors(this))
      .filter((o) => typeof (this as any)[o[0]] !== 'string')
      .filter((o) => 'getLabel' in (this as any)[o[0]])
      .map((prop) => (this as any)[prop[0]] as GenericSetting);
  }
}
