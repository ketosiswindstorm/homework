import { RouterLink, RouterLinkActive } from '@angular/router';
import { Component, ElementRef, HostListener, signal } from '@angular/core';
import { DEFAULT_COMPONENT_CONFIG } from '../../constants/APP_COMPONENT';
import { Settings } from '../settings/settings';
import { PostService } from '../../services/post.service';

@Component({
  ...DEFAULT_COMPONENT_CONFIG,
  selector: 'navigation-bar',
  imports: [RouterLink, RouterLinkActive, Settings],
  templateUrl: './navigation-bar.html',
  styleUrl: './navigation-bar.scss',
})
export class NavigationBar {
  protected settingsOpen = signal<boolean>(false);

  constructor(
    private host: ElementRef<HTMLElement>,
    protected readonly postService: PostService,
  ) {}

  protected confirmNavigate() {
    return confirm('Are you sure? \nMaybe not the safest place to go...');
  }

  protected toggleSettingsOpen() {
    this.settingsOpen.set(!this.settingsOpen());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;

    if (!this.host.nativeElement.contains(target)) {
      this.settingsOpen.set(false);
    }
  }
}
