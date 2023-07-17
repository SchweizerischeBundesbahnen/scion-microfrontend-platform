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
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MessageClient, OutletRouter} from '@scion/microfrontend-platform';
import {Beans} from '@scion/toolkit/bean-manager';
import {SciFormFieldModule} from '@scion/components.internal/form-field';

@Component({
  selector: 'app-clear-outlet-then-send-message-test-page',
  templateUrl: './clear-outlet-then-send-message-test-page.component.html',
  styleUrls: ['./clear-outlet-then-send-message-test-page.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SciFormFieldModule,
  ],
})
export default class ClearOutletThenSendMessageTestPageComponent {

  public form = this._formBuilder.group({
    outlet: this._formBuilder.control('', Validators.required),
    topic: this._formBuilder.control('', Validators.required),
  });

  constructor(private _formBuilder: NonNullableFormBuilder) {
  }

  public async onRunTestClick(): Promise<void> {
    // Clear the router outlet.
    await Beans.get(OutletRouter).navigate(null, {outlet: this.form.controls.outlet.value});
    // Send message to the topic.
    await Beans.get(MessageClient).publish(this.form.controls.topic.value);
    // Reset the form.
    this.form.reset();
  }
}
