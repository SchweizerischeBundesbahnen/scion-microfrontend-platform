/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, HostBinding, input, untracked} from '@angular/core';
import {IntentMessage, MessageHeaders, TopicMessage} from '@scion/microfrontend-platform';
import {AppendParamDataTypePipe} from '../append-param-data-type.pipe';
import {SciKeyValueComponent} from '@scion/components.internal/key-value';

@Component({
  selector: 'app-message-list-item',
  templateUrl: './message-list-item.component.html',
  styleUrls: ['./message-list-item.component.scss'],
  imports: [
    SciKeyValueComponent,
    AppendParamDataTypePipe,
  ],
})
export class MessageListItemComponent {

  public readonly isTopicMessage = input.required<boolean>();
  public readonly message = input.required<TopicMessage | IntentMessage>();

  protected readonly MessageHeaders = MessageHeaders;
  protected readonly intentMessage = computed(() => this.message() as IntentMessage);
  protected readonly topicMessage = computed(() => this.message() as TopicMessage);

  @HostBinding('attr.data-e2e-capability')
  protected capability: string | undefined;

  constructor() {
    effect(() => {
      const isTopicMessage = this.isTopicMessage();
      const intentMessage = this.intentMessage();
      untracked(() => {
        this.capability = isTopicMessage ? undefined : JSON.stringify(intentMessage.capability, null, 2);
      });
    });
  }
}
