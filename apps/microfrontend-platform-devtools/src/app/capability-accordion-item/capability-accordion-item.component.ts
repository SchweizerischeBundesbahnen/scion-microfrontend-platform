/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ChangeDetectionStrategy, Component, computed, inject, input, Signal} from '@angular/core';
import {Clipboard} from '@angular/cdk/clipboard';
import {Capability} from '@scion/microfrontend-platform';
import {Router} from '@angular/router';
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'devtools-capability-accordion-item',
  templateUrl: './capability-accordion-item.component.html',
  styleUrls: ['./capability-accordion-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SciQualifierChipListComponent,
    SciMaterialIconDirective,
  ],
})
export class CapabilityAccordionItemComponent {

  public readonly appSymbolicName = input<string | undefined>();
  public readonly capability = input.required<Capability>();

  private readonly _router = inject(Router);
  private readonly _clipboard = inject(Clipboard);

  protected readonly tooltip = this.computeTooltip();

  protected onOpenAppClick(event: MouseEvent, appSymbolicName: string): void {
    event.stopPropagation();
    event.preventDefault();
    void this._router.navigate(['/apps', {outlets: {details: [appSymbolicName]}}]);
  }

  protected onCopyToClipboard(event: MouseEvent): void {
    event.stopPropagation();
    this._clipboard.copy(JSON.stringify({
      type: this.capability().type,
      qualifier: this.capability().qualifier,
    }, null, 2));
  }

  private computeTooltip(): Signal<string> {
    return computed(() => {
      const tooltip = new Array<string>();

      if (this.capability().inactive) {
        tooltip.push('Inactive Capability: Only available to applications with the application flag "capabilityActiveCheckDisabled" enabled (discouraged)');
      }

      if (this.capability().private) {
        tooltip.push('Private Capability: Hidden from other applications except for applications with the application flag "scopeCheckDisabled" enabled (discouraged)');
      }
      else {
        tooltip.push('Public Capability: Visible to other applications if an intention is declared.');
      }

      return tooltip.join('\n');
    });
  }
}
