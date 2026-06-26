import { Component, ElementRef, HostListener, signal, OnInit, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { PostService } from '../../../services/post.service';
import { SimpleTag } from '../../../model/Tag';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'search-bar',
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar implements OnInit, OnDestroy {
  protected searchText = '';

  protected selectedOption = signal<number>(0);
  protected active = signal<boolean>(false);
  protected autocomplete = signal<Array<SimpleTag>>([]);
  protected addOrExclude = signal<'include' | 'exclude'>('include');

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private host: ElementRef<HTMLElement>,
    protected readonly postService: PostService,
    protected readonly settingsService: SettingsService,
  ) {}

  ngOnInit() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((text) => {
          if (text === '') {
            return of([]);
          } else {
            return this.postService.getAutoComplete(text.replaceAll(' ', '_'));
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((tags) => {
        this.autocomplete.set(tags);
      });
  }

  protected async onKeyUp(e: KeyboardEvent) {
    const simpleTag = this.autocomplete().at(this.selectedOption());
    if (e.key === 'Enter' && simpleTag) {
      await this.handleTagClick(simpleTag);
    }
  }

  protected onKeyDown(e: KeyboardEvent) {
    const options = this.autocomplete().length;

    if (e.key === 'ArrowDown') {
      this.selectedOption.set((this.selectedOption() + 1) % options);
    }

    if (e.key === 'ArrowUp') {
      this.selectedOption.set((this.selectedOption() - 1 + options) % options);
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      this.addOrExclude.set(this.addOrExclude() === 'include' ? 'exclude' : 'include');
    }
  }

  protected onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.searchText = value;
    this.search$.next(value);
  }

  protected onFocus() {
    this.active.set(true);
  }

  protected getClass() {
    return this.active() ? 'active' : '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;

    if (!this.host.nativeElement.contains(target)) {
      this.active.set(false);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected async getNewPosts() {
    await this.postService.getPosts();
    await this.postService.getPostCount();
  }

  protected getTagClass(tag: SimpleTag | string, $index?: number) {
    let base = this.postService.getTagClass(tag);
    if (this.selectedOption() === $index) {
      base += ' selected';
    }

    base += ` ${this.addOrExclude()}`;

    return base;
  }

  protected async handleTagClickExclude(tag: SimpleTag) {
    const result = await this.postService.handleSimpleTagExclude(tag);
    if (!this.settingsService.clearAfterSelectTag.get()) {
      return;
    }

    if (result === 'added' || result === 'removed') {
      this.searchText = '';
      this.search$.next('');
    }
  }

  protected async handleTagClick(tag: SimpleTag) {
    const result =
      this.addOrExclude() === 'include'
        ? await this.postService.handleSimpleTag(tag)
        : await this.postService.handleSimpleTagExclude(tag);

    if (!this.settingsService.clearAfterSelectTag.get()) {
      return;
    }

    if (result === 'added' || result === 'removed') {
      this.searchText = '';
      this.search$.next('');
    }
  }
}
