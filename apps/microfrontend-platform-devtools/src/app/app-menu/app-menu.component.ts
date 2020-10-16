/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'devtools-app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('openCloseMenu', [
      transition(':enter', [
        style({
          width: '0',
        }),
        animate(100, style({width: '*'})),
      ]),
    ]),
  ],
})
export class AppMenuComponent {

  // tslint:disable-next-line:no-output-native
  @Output()
  public close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  public onBackdropClick(): void {
    this.close.emit();
  }

  public onMenuItemClick(): void {
    this.close.emit();
  }
}
