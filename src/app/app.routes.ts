import { Routes } from '@angular/router';
import { Home } from './home/home';
import { SourceCode } from './source-code/source-code';

export const routes: Routes = [
  {
    path: 'home',
    component: Home,
  },
  {
    path: 'source',
    component: SourceCode,
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
