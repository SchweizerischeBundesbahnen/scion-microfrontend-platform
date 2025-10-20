/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, DestroyRef, inject} from '@angular/core';
import {IntentClient, IntentMessage, MessageClient, MessageHeaders, TopicMessage} from '@scion/microfrontend-platform';
import {FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {distinctUntilChanged, finalize, startWith} from 'rxjs/operators';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Beans} from '@scion/toolkit/bean-manager';
import {MessageListItemComponent} from '../message-list-item/message-list-item.component';
import {AppAsPipe} from '../../common/as.pipe';
import {stringifyError} from '../../common/stringify-error.util';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'app-receive-message',
  templateUrl: './receive-message.component.html',
  styleUrls: ['./receive-message.component.scss'],
  imports: [
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciKeyValueFieldComponent,
    SciListComponent,
    SciListItemDirective,
    MessageListItemComponent,
    AppAsPipe,
    SciMaterialIconDirective,
  ],
})
export default class ReceiveMessageComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _messageClient = Beans.get(MessageClient);
  private readonly _intentClient = Beans.get(IntentClient);

  private _subscription: Subscription | undefined;

  protected form = this._formBuilder.group({
    flavor: this._formBuilder.control<MessagingFlavor>(MessagingFlavor.Topic, Validators.required),
    destination: this._formBuilder.group<TopicMessageDestination | IntentMessageDestination>(this.createTopicDestination()),
  });

  protected messages: (TopicMessage | IntentMessage)[] = [];
  protected MessagingFlavor = MessagingFlavor;

  protected subscribeError: string | undefined;

  protected MessageHeaders = MessageHeaders;
  protected TopicMessageDestinationFormGroup = FormGroup<TopicMessageDestination>;
  protected IntentMessageDestinationFromGroup = FormGroup<IntentMessageDestination>;

  constructor() {
    this.form.controls.flavor.valueChanges
      .pipe(
        startWith(this.form.controls.flavor.value),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(flavor => {
        this.onFlavorChange(flavor);
      });
  }

  private onFlavorChange(flavor: MessagingFlavor): void {
    const destination = flavor === MessagingFlavor.Topic ? this.createTopicDestination() : this.createIntentDestination();
    this.form.setControl('destination', this._formBuilder.group(destination));
  }

  protected onSubscribe(): void {
    this.isTopicMessaging() ? this.subscribeTopic() : this.subscribeIntent();
  }

  private subscribeTopic(): void {
    this.form.disable();
    this.subscribeError = undefined;
    try {
      const topic = (this.form.controls.destination as FormGroup<TopicMessageDestination>).controls.topic.value;
      this._subscription = this._messageClient.observe$(topic)
        .pipe(
          finalize(() => this.form.enable()),
          takeUntilDestroyed(this._destroyRef),
        )
        .subscribe({
          next: message => this.messages.push(message),
          error: (error: unknown) => this.subscribeError = stringifyError(error),
        });
    }
    catch (error: unknown) {
      this.form.enable();
      this.subscribeError = stringifyError(error);
    }
  }

  private subscribeIntent(): void {
    const destinationFormGroup = this.form.controls.destination as FormGroup<IntentMessageDestination>;
    const type = destinationFormGroup.controls.type.value;
    const qualifier = SciKeyValueFieldComponent.toDictionary(destinationFormGroup.controls.qualifier) ?? undefined;

    this.form.disable();
    this.subscribeError = undefined;
    try {
      this._subscription = this._intentClient.observe$({type, qualifier})
        .pipe(
          finalize(() => this.form.enable()),
          takeUntilDestroyed(this._destroyRef),
        )
        .subscribe({
          next: message => this.messages.push(message),
          error: (error: unknown) => this.subscribeError = stringifyError(error),
        });
    }
    catch (error: unknown) {
      this.form.enable();
      this.subscribeError = stringifyError(error);
    }
  }

  protected onUnsubscribe(): void {
    this._subscription!.unsubscribe();
    this._subscription = undefined;
    this.messages.length = 0;
  }

  protected onClear(): void {
    this.messages.length = 0;
  }

  protected onReply(replyTo: unknown): void {
    void this._messageClient.publish(replyTo as string, 'this is a reply');
  }

  protected get isSubscribed(): boolean {
    return !!this._subscription && !this._subscription.closed;
  }

  protected isTopicMessaging(): boolean {
    return this.form.controls.flavor.value === MessagingFlavor.Topic;
  }

  private createTopicDestination(): TopicMessageDestination {
    return {
      topic: this._formBuilder.control('', Validators.required),
    };
  }

  private createIntentDestination(): IntentMessageDestination {
    return {
      type: this._formBuilder.control(''),
      qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
      params: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    };
  }
}

enum MessagingFlavor {
  Topic = 'Topic', Intent = 'Intent',
}

interface TopicMessageDestination {
  topic: FormControl<string>;
}

interface IntentMessageDestination {
  type: FormControl<string>;
  qualifier: FormArray<FormGroup<KeyValueEntry>>;
  params: FormArray<FormGroup<KeyValueEntry>>;
}
