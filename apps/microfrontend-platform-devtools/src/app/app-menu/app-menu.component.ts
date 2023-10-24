/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, Output} from '@angular/core';
import {animate, AnimationMetadata, style, transition, trigger} from '@angular/animations';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'devtools-app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    SciViewportComponent,
    SciMaterialIconDirective,
  ],
  animations: [
    trigger('openCloseMenu', provideMenuAnimation()),
  ],
})
export class AppMenuComponent {

  @Output()
  public close = new EventEmitter<void>();  // eslint-disable-line @angular-eslint/no-output-native

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    this.close.emit();
  }

  @HostListener('mousedown', ['$event'])
  public onHostCloseEvent(event: Event): void {
    event.stopPropagation(); // Prevent closing this overlay if emitted from a child of this overlay.
  }

  @HostListener('document:mousedown')
  public onDocumentCloseEvent(): void {
    this.close.emit();
  }

  public onMenuItemClick(event: MouseEvent): void {
    event.preventDefault(); // Prevent href navigation imposed by accessibility rules
    this.close.emit();
  }
}

function provideMenuAnimation(): AnimationMetadata[] {
  return [
    transition(':enter', [
      style({
        width: '0',
      }),
      animate(100, style({width: '*'})),
    ]),
  ];
}
