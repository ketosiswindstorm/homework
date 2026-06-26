import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { Post } from '../../../model/Post';
import { PostService } from '../../../services/post.service';
import { SettingsService } from '../../../services/settings.service';
import { DEFAULT_COMPONENT_CONFIG } from '../../../constants/APP_COMPONENT';

@Component({
  ...DEFAULT_COMPONENT_CONFIG,
  selector: 'post-element',
  imports: [],
  templateUrl: './post.html',
  styleUrl: './post.scss',
})
export class PostElement {
  @ViewChild('media') mediaElement?: ElementRef<HTMLVideoElement | HTMLImageElement>;

  @Input() post?: Post;
  @Output() goFullscreen = new EventEmitter<number>();

  @HostBinding('attr.data-id')
  get id() {
    return this.post?.id || 0;
  }

  inView = signal<boolean>(false);

  constructor(
    protected readonly postService: PostService,
    protected readonly settings: SettingsService,
  ) {
    effect(() => {
      if (!this.inView()) {
        if (this.mediaElement?.nativeElement instanceof HTMLVideoElement) {
          this.mediaElement.nativeElement.pause();
        }
      }
    });

    effect(() => {
      let isFullscreen = this.postService.fullscreenPost() === this.post?.id;
      if (isFullscreen) {
        setTimeout(() => {
          this.mediaElement?.nativeElement.scrollIntoView({ behavior: 'smooth' });
          this.mediaElement?.nativeElement.focus();
        }, 150);
      }

      if (this.mediaElement?.nativeElement instanceof HTMLVideoElement) {
        if (isFullscreen) {
          void this.mediaElement.nativeElement.play();
        } else {
          this.mediaElement.nativeElement.pause();
        }
      }
    });
  }

  protected decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  @HostListener('window:wheel')
  @HostListener('document:wheel')
  protected updateInView() {
    if (!this.mediaElement) {
      return;
    }

    const element = this.mediaElement.nativeElement;
    if (!element) {
      this.inView.set(false);
      return;
    }

    const rect = element.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const visibilityRatio = Math.max(0, visibleHeight) / rect.height;

    this.inView.set(visibilityRatio >= 0.6);
  }

  ngAfterViewInit() {
    this.updateInView();
  }
}
