import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { SettingsService } from '../services/settings.service';
import { APIService } from '../services/api.service';
import { PostService } from '../services/post.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    SettingsService,
    APIService,
    PostService,
  ],
};
