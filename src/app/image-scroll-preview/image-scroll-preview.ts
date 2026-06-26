import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'image-scroll-preview',
  imports: [],
  templateUrl: './image-scroll-preview.html',
  styleUrl: './image-scroll-preview.scss',
})
export class ImageScrollPreview {
  @Input() src?: string;

  @Output() toggleImagePreview = new EventEmitter();

  @HostListener('click')
  protected handleClick(){
    this.toggleImagePreview.emit();
  }

  constructor() {
    this.src ??= './missing-homework.png';
  }
}
