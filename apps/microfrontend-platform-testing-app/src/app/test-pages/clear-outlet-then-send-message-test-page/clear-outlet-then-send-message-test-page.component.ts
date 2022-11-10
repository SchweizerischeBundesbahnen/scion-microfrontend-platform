/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, UntypedFormBuilder, Validators} from '@angular/forms';
import {MessageClient, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {SciFormFieldModule} from '@scion/components.internal/form-field';

export const OUTLET = 'outlet';
export const TOPIC = 'topic';

@Component({
  selector: 'app-clear-outlet-then-send-message-test-page',
  templateUrl: './clear-outlet-then-send-message-test-page.component.html',
  styleUrls: ['./clear-outlet-then-send-message-test-page.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, SciFormFieldModule],
})
export class ClearOutletThenSendMessageTestPageComponent {

  public OUTLET = OUTLET;
  public TOPIC = TOPIC;

  public form: FormGroup;

  constructor(formBuilder: UntypedFormBuilder) {
    this.form = formBuilder.group({
      [OUTLET]: new FormControl<string>('', Validators.required),
      [TOPIC]: new FormControl<string>('', Validators.required),
    });
  }

  public async onRunTestClick(): Promise<void> {
    // Clear the router outlet.
    await Beans.get(OutletRouter).navigate(null, {outlet: this.form.get(OUTLET).value});
    // Send message to the topic.
    await Beans.get(MessageClient).publish(this.form.get(TOPIC).value);
    // Reset the form.
    this.form.reset();
  }
}
