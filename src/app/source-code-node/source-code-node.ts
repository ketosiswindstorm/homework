import { Component, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_COMPONENT_CONFIG } from '../../constants/APP_COMPONENT';

type RepoEntry = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: RepoEntry[];
};

@Component({
  ...DEFAULT_COMPONENT_CONFIG,
  selector: 'source-code-node',
  standalone: true,
  templateUrl: './source-code-node.html',
  styleUrl: './source-code-node.scss',
  imports: [RouterLink],
})
export class SourceCodeNode {
  @Input() node!: RepoEntry;
  @Input() disabled!: boolean;

  expanded = signal<boolean>(false);

  toggle(event: PointerEvent) {
    if (this.node.type === 'dir') {
      this.expanded.set(!this.expanded());
    }

    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.querySelector('a')?.click();
    }
  }
}
