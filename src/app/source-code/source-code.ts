import { Component, OnInit, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SourceCodeNode } from '../source-code-node/source-code-node';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../services/settings.service';
import { DEFAULT_COMPONENT_CONFIG } from '../../constants/APP_COMPONENT';

type RepoEntry = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  _links: {
    self: string;
    git: string;
    html: string;
  };
  children?: RepoEntry[];
};

type FileData = {
  sha: string;
  node_id: string;
  size: number;
  url: string;
  content: string;
  encoding: string;
};

@Component({
  ...DEFAULT_COMPONENT_CONFIG,
  selector: 'source-code',
  standalone: true,
  imports: [SourceCodeNode],
  templateUrl: './source-code.html',
  styleUrl: './source-code.scss',
})
export class SourceCode implements OnInit {
  filePath = signal<string>('');
  fileData = signal<string>('');
  entries = signal<RepoEntry[]>([]);
  loading = signal<boolean>(true);

  private readonly baseURL = 'https://api.github.com/repos/ketosiswindstorm/homework/contents';
  private readonly headers: HttpHeaders;

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly settingsService: SettingsService,
  ) {
    this.headers = new HttpHeaders({
      Authorization: `Bearer ${this.settingsService.githubAPIKey.get()}`,
      Accept: 'application/vnd.github+json',
    });
  }

  async ngOnInit() {
    this.entries.set(await this.fetchDirectory(this.baseURL));

    this.route.queryParamMap.subscribe((params) => {
      this.filePath.set(params.get('file') || '');
      this.getCurrentFile();
      this.loading.set(false);
    });
  }

  private getExtension(name: string): string {
    const i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i + 1).toLowerCase();
  }

  protected getCurrentFile() {
    this.loading.set(true);

    if (!this.filePath) {
      this.fileData.set('');
    }

    const keys = this.filePath().split('/').filter(Boolean);

    const findInTree = (entries: RepoEntry[], index: number): RepoEntry | undefined => {
      if (index >= keys.length) {
        return undefined;
      }

      const key = keys[index];

      const match = entries.find((e) => e.name === key);
      if (!match) {
        return undefined;
      }

      if (index === keys.length - 1) {
        return match;
      }

      if (match.type === 'dir' && match.children) {
        return findInTree(match.children, index + 1);
      }

      return undefined;
    };

    const entry = findInTree(this.entries(), 0);

    if (entry) {
      this.http.get<FileData>(entry._links.git, { headers: this.headers }).subscribe((data) => {
        this.fileData.set(atob(data.content));
      });
    } else {
      this.fileData.set('Missing data...');
    }
  }

  getLines(text: string): string[] {
    return text?.split('\n') ?? [];
  }

  private sortEntries(a: RepoEntry, b: RepoEntry): number {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }

    if (a.type === 'dir' && b.type === 'dir') {
      return a.name.localeCompare(b.name);
    }

    const extA = this.getExtension(a.name);
    const extB = this.getExtension(b.name);

    if (extA !== extB) {
      return extA.localeCompare(extB);
    }

    return a.name.localeCompare(b.name);
  }

  private async fetchDirectory(url: string): Promise<RepoEntry[]> {
    try {
      const entries = await firstValueFrom(
        this.http.get<RepoEntry[]>(url, { headers: this.headers }),
      );

      const result = await Promise.all(
        entries.map(async (entry) => {
          if (entry.type === 'dir') {
            return {
              ...entry,
              children: await this.fetchDirectory(entry.url),
            };
          }
          return entry;
        }),
      );

      return result.filter(Boolean).sort((a, b) => this.sortEntries(a, b));
    } catch (err) {
      return [];
    }
  }
}
