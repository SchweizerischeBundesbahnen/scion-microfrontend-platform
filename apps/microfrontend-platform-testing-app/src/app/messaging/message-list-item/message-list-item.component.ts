/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Component, HostBinding, Input, OnChanges, SimpleChanges} from '@angular/core';
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
export class MessageListItemComponent implements OnChanges {

  public MessageHeaders = MessageHeaders;

  @Input({required: true})
  public isTopicMessage!: boolean;

  @Input({required: true})
  public message!: TopicMessage | IntentMessage;

  @HostBinding('attr.data-e2e-capability')
  public capability: string | undefined;

  public ngOnChanges(changes: SimpleChanges): void {
    this.capability = (this.isTopicMessage ? undefined : JSON.stringify((this.intentMessage).capability, null, 2));
  }

  public get intentMessage(): IntentMessage {
    return this.message as IntentMessage;
  }

  public get topicMessage(): TopicMessage {
    return this.message as TopicMessage;
  }
}
