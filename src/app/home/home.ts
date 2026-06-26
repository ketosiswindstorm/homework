import {
  Component,
  effect,
  ElementRef,
  HostBinding,
  HostListener,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { PostService } from '../../services/post.service';
import { DEFAULT_COMPONENT_CONFIG } from '../../constants/APP_COMPONENT';
import { PostElement } from './post/post';
import { SearchBar } from './search-bar/search-bar';

@Component({
  ...DEFAULT_COMPONENT_CONFIG,
  selector: 'app-home',
  imports: [PostElement, SearchBar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  fullscreen = signal<boolean>(false);

  @ViewChild(SearchBar) searchBar!: SearchBar;

  @ViewChildren(PostElement) posts!: QueryList<PostElement>;

  @HostBinding('attr.class') get clazz() {
    return this.fullscreen() ? 'fullscreen' : '';
  }

  constructor(
    protected readonly postService: PostService,
    private readonly elementRef: ElementRef<HTMLElement>,
  ) {}

  @HostListener('document:fullscreenchange')
  protected async fullscreenChange() {
    this.fullscreen.set(!!document.fullscreenElement);

    if (this.fullscreen()) {
      return;
    }

    for (const postElement of this.posts.toArray()) {
      if (postElement.post?.id !== this.postService.fullscreenPost()) {
        continue;
      }

      setTimeout(() => {
        postElement.mediaElement?.nativeElement.parentElement?.scrollIntoView({
          behavior: 'smooth',
        });
        postElement.mediaElement?.nativeElement.focus();
      }, 150);

      if (!(postElement.mediaElement?.nativeElement instanceof HTMLVideoElement)) {
        return;
      }

      postElement.mediaElement.nativeElement.pause();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected async onKeyDown(evt: KeyboardEvent) {
    if (this.postService.fullscreenPost() === undefined) {
      return;
    }

    if (evt.key === 'ArrowDown') {
      this.postService.goToNextPost();
    }

    if (evt.key === 'ArrowUp') {
      this.postService.goToPreviousPost();
    }
  }

  async goFullscreen(id: number) {
    this.postService.fullscreenPost.set(id);

    if (!document.fullscreenElement) {
      await this.elementRef.nativeElement.requestFullscreen();

      for (const postElement of this.posts.toArray()) {
        if (postElement.post?.id !== this.postService.fullscreenPost()) {
          continue;
        }

        setTimeout(() => {
          postElement.mediaElement?.nativeElement.scrollIntoView({ behavior: 'smooth' });
          postElement.mediaElement?.nativeElement.focus();
        }, 150);
      }
    }
  }
}
