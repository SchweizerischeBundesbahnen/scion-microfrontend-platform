/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { Capability } from '@scion/microfrontend-platform';
import { Router } from '@angular/router';

@Component({
  selector: 'devtools-capability-accordion-item',
  templateUrl: './capability-accordion-item.component.html',
  styleUrls: ['./capability-accordion-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapabilityAccordionItemComponent {

  @Input()
  public appSymbolicName;

  @Input()
  public capability: Capability;

  constructor(private _router: Router, private _clipboard: Clipboard) {
  }

  public onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  public onCopyToClipboard(event: MouseEvent): void {
    event.stopPropagation();
    this._clipboard.copy(JSON.stringify({
      type: this.capability.type,
      qualifier: this.capability.qualifier,
    }, null, 2));
  }
}
