/*
 * Copyright (c) 2018-2020 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Beans} from '@scion/toolkit/bean-manager';
import {Logger} from '../../logger';

/**
 * Describes a user interaction with the keyboard.
 *
 * @ignore
 */
export class Keystroke {

  /**
   * Represents this keystroke as a string with its parts separated by a dot.
   */
  public readonly parts: string;

  /**
   * Flags to control keystroke handling.
   */
  public flags?: KeystrokeFlags;

  constructor(public readonly eventType: string, key: string, modifiers?: {control?: boolean; shift?: boolean; alt?: boolean; meta?: boolean}, flags?: KeystrokeFlags) {
    const parts = [];
    parts.push(eventType);
    if (modifiers) {
      modifiers.control && parts.push('control');
      modifiers.alt && parts.push('alt');
      modifiers.shift && parts.push('shift');
      modifiers.meta && parts.push('meta');
    }
    parts.push(key.toLowerCase());
    this.parts = parts.join('.');
    this.flags = flags;
  }

  public withFlags(flags: KeystrokeFlags): this {
    this.flags = flags;
    return this;
  }

  /**
   * Creates a {@link Keystroke} from the given keyboard event.
   */
  public static fromEvent(event: KeyboardEvent): Keystroke {
    if (!event) {
      throw Error('[KeystrokeParseError] Cannot create the keystroke from `null` or `undefined`.');
    }
    return new Keystroke(event.type, escapeKeyboardEventKey(event.key), {control: event.ctrlKey, shift: event.shiftKey, alt: event.altKey, meta: event.metaKey});
  }

  /**
   * Parses the textual representation of a keystroke into a {@link Keystroke} object.
   *
   * keydown.control.alt.enter{preventDefault=true}
   * |<--1->|<----2---->|<-3->|<--------4--------->|
   *
   * 1: Event type
   * 2: Modifier part(s) (optional)
   * 3. Key as defined in https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values.
   *    Two keys are an exception to the value of the {@link KeyboardEvent#key} property: dot and space.
   * 4. flags (optional)
   */
  public static fromString(value: string): Keystroke {
    if (!value) {
      throw Error('[KeystrokeParseError] Cannot parse the keystroke from \'null\' or \'undefined\'.');
    }

    const flags = parseFlags(value);
    if (flags !== undefined) {
      value = value.substring(0, value.indexOf('{'));
    }

    const parts = value.split('.');
    if (parts.length < 2) {
      throw Error(`[KeystrokeParseError] Cannot parse the keystroke '${value}'. Requires at least the event type and keyboard key, and optionally some modifiers. Examples: 'keydown.control.z', 'keydown.escape', 'keyup.enter', 'keydown.control.alt.enter', 'keydown.control.space'`);
    }

    const eventType = parts[0];
    if (eventType !== 'keydown' && eventType !== 'keyup') {
      throw Error(`[KeystrokeParseError] Cannot parse the keystroke '${value}'. Unsupported event type. Supported event types are: 'keydown' or 'keyup'. Examples: 'keydown.control.z', 'keydown.escape', 'keyup.enter', 'keydown.control.alt.enter', 'keydown.control.space'`);
    }

    const key = parts[parts.length - 1];
    if (!key || new Set().add('alt').add('shift').add('control').add('meta').has(key.toLowerCase())) {
      throw Error(`[KeystrokeParseError] Cannot parse the keystroke '${value}'. The keyboard key must be the last part. Examples: 'keydown.control.z', 'keydown.escape', 'keyup.enter', 'keydown.control.alt.enter', 'keydown.control.space'`);
    }

    const modifiers = new Set(parts.slice(1, -1));
    const keystroke = new Keystroke(eventType, key, {control: modifiers.delete('control'), shift: modifiers.delete('shift'), alt: modifiers.delete('alt'), meta: modifiers.delete('meta')}, flags);
    if (modifiers.size > 0) {
      throw Error(`[KeystrokeParseError] Cannot parse the keystroke '${value}'. Illegal modifier found. Supported modifiers are: 'alt', 'shift', 'control' or 'meta'. Examples: 'keydown.control.z', 'keydown.escape', 'keyup.enter', 'keydown.control.alt.enter', 'keydown.control.space'`);
    }

    return keystroke;
  }
}

/** @ignore */
function escapeKeyboardEventKey(key: string): string {
  switch (key) {
    case '.':
      return 'dot';
    case ' ':
      return 'space';
    default:
      return key;
  }
}

/** @ignore */
function parseFlags(keystroke: string): KeystrokeFlags | undefined {
  const flagsStr = keystroke.match(/{(?<flagsDictionary>.*)}/)?.groups!['flagsDictionary'] ?? null;
  if (flagsStr === null) {
    return undefined;
  }
  if (flagsStr === '') {
    return {};
  }

  return flagsStr
    .split(';')
    .map(flag => flag.split('='))
    .reduce((flags, [flagName, flagValue]) => {
      switch (flagName) {
        case 'preventDefault':
          return {...flags, preventDefault: flagValue === 'true'};
        default: {
          Beans.get(Logger).warn(`[KeystrokeParseError] Ignore unkown flag \'${keystroke}\'. Supported flags are: \'preventDefault\'.`);
          return flags;
        }
      }
    }, {} as KeystrokeFlags);
}

/**
 * Flags to control keystroke handling.
 *
 * @ignore
 */
export interface KeystrokeFlags {
  /**
   * If set to `true`, the default action of the keystroke is prevented.
   */
  preventDefault?: boolean;
}
