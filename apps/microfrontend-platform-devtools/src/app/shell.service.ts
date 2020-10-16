import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

const BLANK_TITLE = '';

@Injectable({
  providedIn: 'root'
})
export class ShellService {

  private _primaryTitle$ = new BehaviorSubject(BLANK_TITLE);
  private _detailsTitle$ = new BehaviorSubject(BLANK_TITLE);

  constructor(private _router: Router) { }

  public set primaryTitle(title: string) {
    this._primaryTitle$.next(title);
  }

  public get primaryTitle$(): Observable<string> {
    return this._primaryTitle$;
  }

  public set detailsTitle(title: string) {
    this._detailsTitle$.next(title);
  }

  public get detailsTitle$(): Observable<string> {
    return this._detailsTitle$;
  }

  public isDetailsOutletActive$(): Observable<boolean> {
    return this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map((event: NavigationEnd) => {
          const urlTree = this._router.parseUrl(event.urlAfterRedirects);
          return urlTree.root.children[PRIMARY_OUTLET]?.children['details'] !== undefined;
        }),
      );
  }
}
