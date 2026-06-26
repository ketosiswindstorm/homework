import { Injectable, signal } from '@angular/core';
import { SimpleTag, Tag } from '../model/Tag';
import { HttpClient } from '@angular/common/http';
import { APIService } from './api.service';
import { Post } from '../model/Post';
import { firstValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  public readonly postCount = signal<number>(0);
  public readonly includedTagSet = signal<Array<Tag>>([]);
  public readonly excludedTagSet = signal<Array<Tag>>([]);
  public readonly posts = signal<Array<Post>>([]);
  public readonly fullscreenPost = signal<number | undefined>(undefined);

  constructor(
    private readonly http: HttpClient,
    private readonly apiService: APIService,
  ) {}

  addTag(tag: Tag) {
    this.removeExcludedTag(tag);

    if (this.includedTagSet().find((t) => t.id === tag.id)) {
      return false;
    }

    this.includedTagSet.set([...this.includedTagSet(), tag]);
    return true;
  }

  removeTag(tag: Tag) {
    const idx = this.includedTagSet().findIndex((t) => t.id === tag.id);
    if (idx === -1) {
      return false;
    }

    const tags = this.includedTagSet();
    tags.splice(idx, 1);
    this.includedTagSet.set(tags);
    return true;
  }

  excludeTag(tag: Tag) {
    this.removeTag(tag);

    if (this.excludedTagSet().find((t) => t.id === tag.id)) {
      return false;
    }

    this.excludedTagSet.set([...this.excludedTagSet(), tag]);
    return true;
  }

  removeExcludedTag(tag: Tag) {
    const idx = this.excludedTagSet().findIndex((t) => t.id === tag.id);
    if (idx === -1) {
      return false;
    }

    const tags = this.excludedTagSet();
    tags.splice(idx, 1);
    this.excludedTagSet.set(tags);
    return true;
  }

  async getPosts() {
    this.posts.set(await firstValueFrom(this.http.get<Array<Post>>(this.getPostURL())));
  }

  getTag(content: string) {
    return this.http
      .get(this.apiService.getTagURL(content), {
        headers: {
          Accept: 'application/xml',
        },
        responseType: 'text',
      })
      .pipe(
        map((xmlString) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlString, 'text/xml');
          const tags = doc.querySelector('tags');

          if (!tags) {
            throw new Error('No tag found!');
          }

          const tag = doc.querySelector('tag');
          if (!tag) {
            throw new Error('No tag found!');
          }

          return Tag.fromXML(tag);
        }),
      );
  }

  private getPostURL() {
    let base = this.apiService.getPostURL();
    base += `&tags=${this.includedTagSet()
      .map((t) => t.name)
      .join(' ')}`;

    if (this.includedTagSet().length > 0) {
      base += ' ';
    }

    if (this.excludedTagSet().length > 0) {
      base += '-';
      base += base += `${this.excludedTagSet()
        .map((t) => t.name)
        .join(' -')}`;
    }

    return base;
  }

  async getPostCount() {
    this.http
      .get(this.getPostURL().replace('&json=1', ''), {
        responseType: 'text',
      })
      .subscribe((xmlString) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');
        const parentElement = doc.querySelector('posts');

        if (!parentElement || !parentElement.hasAttribute('count')) {
          this.postCount.set(0);
          return;
        }

        this.postCount.set(Number(parentElement.getAttribute('count') || 0));
      });
  }

  getAutoComplete(input: string) {
    return this.http
      .get(this.apiService.getAutoCompleteURL(input), {
        headers: {
          Accept: 'application/json',
        },
        responseType: 'json',
      })
      .pipe(
        map((json) => {
          return json as Array<SimpleTag>;
        }),
      );
  }

  async handleSimpleTagExclude(t: SimpleTag | string): Promise<'added' | 'removed' | 'ignored'> {
    if (typeof t === 'string') {
      t = {
        value: t,
        label: t,
      };
    }

    const tag = this.excludedTagSet().find((tag) => t.value === tag.name);
    if (tag) {
      if (this.removeExcludedTag(tag)) {
        return 'removed';
      } else {
        return 'ignored';
      }
    } else {
      await firstValueFrom(
        this.getTag(t.value).pipe(
          map((foundTag) => {
            if (this.excludeTag(foundTag)) {
              return 'added';
            } else {
              return 'ignored';
            }
          }),
        ),
      );

      return 'added';
    }
  }

  async handleSimpleTag(t: SimpleTag | string): Promise<'added' | 'removed' | 'ignored'> {
    if (typeof t === 'string') {
      t = {
        value: t,
        label: t,
      };
    }

    const tag = this.includedTagSet().find((tag) => t.value === tag.name);
    if (tag) {
      if (this.removeTag(tag)) {
        return 'removed';
      } else {
        return 'ignored';
      }
    } else {
      await firstValueFrom(
        this.getTag(t.value).pipe(
          map((foundTag) => {
            if (this.addTag(foundTag)) {
              return 'added';
            } else {
              return 'ignored';
            }
          }),
        ),
      );

      return 'added';
    }
  }

  getTagClass(tag: SimpleTag | string) {
    if (typeof tag === 'string') {
      tag = {
        label: tag,
        value: tag,
      };
    }

    if (this.includedTagSet().find((t) => t.name === tag.value)) {
      return 'tag included';
    }

    if (this.excludedTagSet().find((t) => t.name === tag.value)) {
      return 'tag excluded';
    }

    return 'tag';
  }

  goToNextPost() {
    if (this.fullscreenPost() === undefined) {
      return;
    }

    const currentIndex = this.posts().findIndex((p) => p.id === this.fullscreenPost());
    if (currentIndex === -1) {
      return;
    }

    const next = currentIndex + 1;
    if (next >= this.posts().length) {
      return;
    }

    const newPost = this.posts().at(next);
    if (!newPost) {
      return;
    }

    this.fullscreenPost.set(newPost.id);
  }

  goToPreviousPost() {
    if (this.fullscreenPost() === undefined) {
      return;
    }

    const currentIndex = this.posts().findIndex((p) => p.id === this.fullscreenPost());
    if (currentIndex === -1) {
      return;
    }

    const previous = currentIndex - 1;
    if (previous < 0) {
      return;
    }

    const newPost = this.posts().at(previous);
    if (!newPost) {
      return;
    }

    this.fullscreenPost.set(newPost.id);
  }
}
