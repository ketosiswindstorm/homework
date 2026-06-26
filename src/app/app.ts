import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationBar } from './navigation-bar/navigation-bar';
import { DEFAULT_COMPONENT_CONFIG } from '../constants/APP_COMPONENT';

@Component({
  ...DEFAULT_COMPONENT_CONFIG,
  selector: 'root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
  imports: [RouterOutlet, NavigationBar],
})
export class App {
  protected readonly title = signal('t');
}
