/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, OnDestroy} from '@angular/core';
import {IntentClient, IntentMessage, MessageClient, MessageHeaders, TopicMessage} from '@scion/microfrontend-platform';
import {FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subject, Subscription} from 'rxjs';
import {distinctUntilChanged, finalize, startWith, takeUntil} from 'rxjs/operators';
import {SciParamsEnterComponent, SciParamsEnterModule} from '@scion/components.internal/params-enter';
import {Beans} from '@scion/toolkit/bean-manager';
import {NgFor, NgIf} from '@angular/common';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {SciListModule} from '@scion/components.internal/list';
import {MessageListItemComponent} from '../message-list-item/message-list-item.component';
import {AppAsPipe} from '../../common/as.pipe';
import {stringifyError} from '../../common/stringify-error.util';

@Component({
  selector: 'app-receive-message',
  templateUrl: './receive-message.component.html',
  styleUrls: ['./receive-message.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    SciFormFieldModule,
    SciParamsEnterModule,
    SciListModule,
    MessageListItemComponent,
    AppAsPipe,
  ],
})
export default class ReceiveMessageComponent implements OnDestroy {

  private _destroy$ = new Subject<void>();
  private _messageClient: MessageClient;
  private _intentClient: IntentClient;
  private _subscription: Subscription | undefined;

  public form = this._formBuilder.group({
    flavor: this._formBuilder.control<MessagingFlavor>(MessagingFlavor.Topic, Validators.required),
    destination: this._formBuilder.group<TopicMessageDestination | IntentMessageDestination>(this.createTopicDestination()),
  });

  public messages: (TopicMessage | IntentMessage)[] = [];
  public MessagingFlavor = MessagingFlavor;

  public subscribeError: string | undefined;

  public MessageHeaders = MessageHeaders;
  public TopicMessageDestinationFormGroup = FormGroup<TopicMessageDestination>;
  public IntentMessageDestinationFromGroup = FormGroup<IntentMessageDestination>;

  constructor(private _formBuilder: NonNullableFormBuilder) {
    this._messageClient = Beans.get(MessageClient);
    this._intentClient = Beans.get(IntentClient);

    this.form.controls.flavor.valueChanges
      .pipe(
        startWith(this.form.controls.flavor.value),
        distinctUntilChanged(),
        takeUntil(this._destroy$),
      )
      .subscribe(flavor => {
        this.onFlavorChange(flavor);
      });
  }

  private onFlavorChange(flavor: MessagingFlavor): void {
    const destination = flavor === MessagingFlavor.Topic ? this.createTopicDestination() : this.createIntentDestination();
    this.form.setControl('destination', this._formBuilder.group(destination));
  }

  public onSubscribe(): void {
    this.isTopicMessaging() ? this.subscribeTopic() : this.subscribeIntent();
  }

  private subscribeTopic(): void {
    this.form.disable();
    this.subscribeError = undefined;
    try {
      const topic = (this.form.controls.destination as FormGroup<TopicMessageDestination>).controls.topic.value;
      this._subscription = this._messageClient.observe$(topic)
        .pipe(finalize(() => this.form.enable()))
        .subscribe({
          next: message => this.messages.push(message),
          error: error => this.subscribeError = error,
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
    const qualifier = SciParamsEnterComponent.toParamsDictionary(destinationFormGroup.controls.qualifier) ?? undefined;

    this.form.disable();
    this.subscribeError = undefined;
    try {
      this._subscription = this._intentClient.observe$({type, qualifier})
        .pipe(finalize(() => this.form.enable()))
        .subscribe({
          next: message => this.messages.push(message),
          error: error => this.subscribeError = error,
        });
    }
    catch (error: unknown) {
      this.form.enable();
      this.subscribeError = stringifyError(error);
    }
  }

  public onUnsubscribe(): void {
    this._subscription!.unsubscribe();
    this._subscription = undefined;
    this.messages.length = 0;
  }

  public onClear(): void {
    this.messages.length = 0;
  }

  public onReply(replyTo: string): void {
    this._messageClient.publish(replyTo, 'this is a reply');
  }

  public get isSubscribed(): boolean {
    return !!this._subscription && !this._subscription.closed;
  }

  public isTopicMessaging(): boolean {
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
      qualifier: this._formBuilder.array<QualifierEntryFormGroup>([]),
      params: this._formBuilder.array<ParamEntryFormGroup>([]),
    };
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._subscription?.unsubscribe();
  }
}

type QualifierEntryFormGroup = FormGroup<{paramName: FormControl<string>; paramValue: FormControl<string>}>;
type ParamEntryFormGroup = FormGroup<{paramName: FormControl<string>; paramValue: FormControl<string>}>;

enum MessagingFlavor {
  Topic = 'Topic', Intent = 'Intent',
}

interface TopicMessageDestination {
  topic: FormControl<string>;
}

interface IntentMessageDestination {
  type: FormControl<string>;
  qualifier: FormArray<QualifierEntryFormGroup>;
  params: FormArray<ParamEntryFormGroup>;
}
