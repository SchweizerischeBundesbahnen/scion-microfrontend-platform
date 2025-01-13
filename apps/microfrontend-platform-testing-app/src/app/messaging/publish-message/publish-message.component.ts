/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, OnDestroy} from '@angular/core';
import {IntentClient, MessageClient, TopicMessage} from '@scion/microfrontend-platform';
import {FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {distinctUntilChanged, finalize, startWith} from 'rxjs/operators';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Beans} from '@scion/toolkit/bean-manager';
import {AsyncPipe} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {TopicSubscriberCountPipe} from '../topic-subscriber-count.pipe';
import {MessageListItemComponent} from '../message-list-item/message-list-item.component';
import {stringifyError} from '../../common/stringify-error.util';
import {AppAsPipe} from '../../common/as.pipe';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {parseTypedValues} from '../../common/typed-value-parser.util';

@Component({
  selector: 'app-publish-message',
  templateUrl: './publish-message.component.html',
  styleUrls: ['./publish-message.component.scss'],
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciKeyValueFieldComponent,
    SciCheckboxComponent,
    SciListComponent,
    SciListItemDirective,
    TopicSubscriberCountPipe,
    MessageListItemComponent,
    AppAsPipe,
  ],
})
export default class PublishMessageComponent implements OnDestroy {

  private _messageClient: MessageClient;
  private _intentClient: IntentClient;
  private _requestResponseSubscription: Subscription | undefined;

  public form = this._formBuilder.group({
    flavor: this._formBuilder.control<MessagingFlavor>(MessagingFlavor.Topic, Validators.required),
    destination: this._formBuilder.group<TopicMessageDestination | IntentMessageDestination>(this.createTopicDestination()),
    message: this._formBuilder.control(''),
    headers: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    requestReply: this._formBuilder.control(false),
    retain: this._formBuilder.control(false),
  });

  public replies: TopicMessage[] = [];

  public publishError: string | undefined;
  public publishing: boolean | undefined;

  public MessagingFlavor = MessagingFlavor;
  public TopicMessageDestinationFormGroup = FormGroup<TopicMessageDestination>;
  public IntentMessageDestinationFromGroup = FormGroup<IntentMessageDestination>;

  constructor(private _formBuilder: NonNullableFormBuilder) {
    this._messageClient = Beans.get(MessageClient);
    this._intentClient = Beans.get(IntentClient);

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

  public onPublish(): void {
    this.isTopicFlavor() ? this.publishMessage() : this.publishIntent();
  }

  public isTopicFlavor(): boolean {
    return this.form.controls.flavor.value === MessagingFlavor.Topic;
  }

  public isRequestReply(): boolean {
    return this.form.controls.requestReply.value;
  }

  public onClear(): void {
    this.replies.length = 0;
  }

  public onCancelPublish(): void {
    this.unsubscribe();
  }

  private unsubscribe(): void {
    this._requestResponseSubscription?.unsubscribe();
    this._requestResponseSubscription = undefined;
    this.replies.length = 0;
  }

  private createTopicDestination(): TopicMessageDestination {
    return {
      topic: this._formBuilder.control('', Validators.required),
    };
  }

  private createIntentDestination(): IntentMessageDestination {
    return {
      type: this._formBuilder.control('', Validators.required),
      qualifier: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
      params: this._formBuilder.array<FormGroup<KeyValueEntry>>([]),
    };
  }

  private publishMessage(): void {
    const topic = (this.form.controls.destination as FormGroup<TopicMessageDestination>).controls.topic.value;
    const message = this.form.controls.message.value || undefined;
    const requestReply = this.form.controls.requestReply.value;
    const headers = SciKeyValueFieldComponent.toMap(this.form.controls.headers) ?? undefined;

    this.markPublishing(true);
    this.publishError = undefined;
    try {
      if (requestReply) {
        this._requestResponseSubscription = this._messageClient.request$(topic, message, {retain: this.form.controls.retain.value, headers})
          .pipe(finalize(() => this.markPublishing(false)))
          .subscribe({
            next: reply => this.replies.push(reply),
            error: error => this.publishError = error,
          });
      }
      else {
        this._messageClient.publish(topic, message, {retain: this.form.controls.retain.value, headers})
          .catch(error => {
            this.publishError = error?.message ?? `${error}`;
          })
          .finally(() => {
            this.markPublishing(false);
          });
      }
    }
    catch (error: unknown) {
      this.markPublishing(false);
      this.publishError = stringifyError(error);
    }
  }

  private publishIntent(): void {
    const destinationFormGroup = this.form.controls.destination as FormGroup<IntentMessageDestination>;
    const type = destinationFormGroup.controls.type.value;
    const qualifier = SciKeyValueFieldComponent.toDictionary(destinationFormGroup.controls.qualifier) ?? undefined;
    const params = parseTypedValues(SciKeyValueFieldComponent.toMap(destinationFormGroup.controls.params)) ?? undefined;

    const message = this.form.controls.message.value || undefined;
    const requestReply = this.form.controls.requestReply.value;
    const headers = SciKeyValueFieldComponent.toMap(this.form.controls.headers, false);

    this.markPublishing(true);
    this.publishError = undefined;
    try {
      if (requestReply) {
        this._requestResponseSubscription = this._intentClient.request$({type, qualifier}, message, {retain: this.form.controls.retain.value, headers})
          .pipe(finalize(() => this.markPublishing(false)))
          .subscribe({
            next: reply => this.replies.push(reply),
            error: error => this.publishError = error,
          });
      }
      else {
        this._intentClient.publish({type, qualifier, params}, message, {retain: this.form.controls.retain.value, headers})
          .catch(error => {
            this.publishError = error?.message ?? `${error}`;
          })
          .finally(() => {
            this.markPublishing(false);
          });
      }
    }
    catch (error: unknown) {
      this.markPublishing(false);
      this.publishError = stringifyError(error);
    }
  }

  private markPublishing(publishing: boolean): void {
    publishing ? this.form.disable() : this.form.enable();
    this.publishing = publishing;
  }

  public ngOnDestroy(): void {
    this.unsubscribe();
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
