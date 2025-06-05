/*
 * Copyright (c) 2018-2021 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {ProgressMonitor} from './progress-monitor';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('ProgressMonitor', () => {

  it('should split the monitor into child monitors', () => {
    expect(new ProgressMonitor().split(1, 2, 1).length).toEqual(3);
    expect(new ProgressMonitor().splitEven(5).length).toEqual(5);
  });

  it('should complete the monitor when "done"', () => {
    const monitor = new ProgressMonitor();
    monitor.done();

    const captor = new ObserveCaptor<number>();
    monitor.progress$.subscribe(captor);
    expect(captor.getLastValue()).toEqual(100);
    expect(captor.hasCompleted()).toBeTrue();
  });

  it('should report `0` as initial progress', () => {
    const monitor = new ProgressMonitor();

    const captor = new ObserveCaptor<number>();
    monitor.progress$.subscribe(captor);
    expect(captor.getLastValue()).toEqual(0);
    expect(captor.hasCompleted()).toBeFalse();
  });

  it('should emit the current progress upon subscription, even after "done"', () => {
    const monitor = new ProgressMonitor();
    const [mon1, mon2] = monitor.splitEven(2) as [ProgressMonitor, ProgressMonitor];

    mon1.done();

    const captor1 = new ObserveCaptor<number>();
    monitor.progress$.subscribe(captor1);
    expect(captor1.getLastValue()).toEqual(50);
    expect(captor1.hasCompleted()).toBeFalse();

    mon2.done();

    const captor2 = new ObserveCaptor<number>();
    monitor.progress$.subscribe(captor2);
    expect(captor2.getLastValue()).toEqual(100);
    expect(captor2.hasCompleted()).toBeTrue();

    expect(captor1.getLastValue()).toEqual(100);
    expect(captor1.hasCompleted()).toBeTrue();
  });

  it('should report progress continuously', () => {
    const monitor = new ProgressMonitor();
    const captor = new ObserveCaptor<number>();
    monitor.progress$.subscribe(captor);

    // split to 25% / 50% / 25%
    const [mon1, mon2, mon3] = monitor.split(1, 2, 1) as [ProgressMonitor, ProgressMonitor, ProgressMonitor];
    // each monitor is 10%
    const [mon2a, mon2b, mon2c, mon2d, mon2e] = mon2.splitEven(5) as [ProgressMonitor, ProgressMonitor, ProgressMonitor, ProgressMonitor, ProgressMonitor];
    // each monitor is 12.5%
    const [mon3a, mon3b] = mon3.splitEven(2) as [ProgressMonitor, ProgressMonitor];

    expect(captor.getLastValue()).toEqual(0);

    mon1.done();
    expect(captor.getLastValue()).toEqual(25);

    mon2a.done();
    expect(captor.getLastValue()).toEqual(35);

    mon2b.done();
    expect(captor.getLastValue()).toEqual(45);

    mon2c.done();
    expect(captor.getLastValue()).toEqual(55);

    mon2d.done();
    expect(captor.getLastValue()).toEqual(65);

    mon2e.done();
    expect(captor.getLastValue()).toEqual(75);

    mon3a.done();
    expect(captor.getLastValue()).toEqual(87.5);

    mon3b.done();
    expect(captor.getLastValue()).toEqual(100);

    expect(captor.hasCompleted()).toBeTrue();
    expect(captor.hasErrored()).toBeFalse();
  });

  it('should allow completing a monitor having child monitors', () => {
    const monitor = new ProgressMonitor();
    const captor = new ObserveCaptor<number>();
    monitor.progress$.subscribe(captor);

    const [mon1, mon2] = monitor.split(1, 1) as [ProgressMonitor, ProgressMonitor];
    const [mon2a, mon2b, mon2c, mon2d, mon2e] = mon2.splitEven(5) as [ProgressMonitor, ProgressMonitor, ProgressMonitor, ProgressMonitor, ProgressMonitor];

    mon1.done();
    expect(captor.getLastValue()).toEqual(50);

    mon2.done();
    expect(captor.getLastValue()).toEqual(100);
    expect(captor.hasCompleted()).toBeTrue();
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.getValues().length).toEqual(3);

    // assert no emission when the parent monitor already completed.
    mon2a.done();
    expect(captor.getLastValue()).toEqual(100);
    expect(captor.getValues().length).toEqual(3);

    mon2b.done();
    expect(captor.getLastValue()).toEqual(100);
    expect(captor.getValues().length).toEqual(3);

    mon2c.done();
    expect(captor.getLastValue()).toEqual(100);
    expect(captor.getValues().length).toEqual(3);

    mon2d.done();
    expect(captor.getLastValue()).toEqual(100);
    expect(captor.getValues().length).toEqual(3);

    mon2e.done();
    expect(captor.getLastValue()).toEqual(100);
    expect(captor.getValues().length).toEqual(3);
  });

  it('should round progress if splitting by 3', () => {
    const monitor = new ProgressMonitor();
    const captor = new ObserveCaptor<number>();
    monitor.progress$.subscribe(captor);

    const [mon1, mon2, mon3] = monitor.splitEven(3) as [ProgressMonitor, ProgressMonitor, ProgressMonitor];

    mon1.done();
    expect(captor.getLastValue()).toEqual(33.33);

    mon2.done();
    expect(captor.getLastValue()).toEqual(66.67);
    mon3.done();
    expect(captor.getLastValue()).toEqual(100);

    expect(captor.getLastValue()).toEqual(100);
    expect(captor.hasCompleted()).toBeTrue();
    expect(captor.hasErrored()).toBeFalse();
  });

  it('should error when splitting the monitor multiple times', () => {
    const monitor = new ProgressMonitor();
    monitor.split(1, 2, 3);

    expect(() => monitor.split(1, 2, 3)).toThrowError('[IllegalMonitorStateError] Monitor cannot be split multiple times.');
  });

  it('should error when splitting even by non-positive value', () => {
    const monitor = new ProgressMonitor();
    expect(() => monitor.splitEven(0)).toThrowError('[IllegalMonitorArgumentError] Monitor split count must be greater than 0, but was 0.');
    expect(() => monitor.splitEven(-1)).toThrowError('[IllegalMonitorArgumentError] Monitor split count must be greater than 0, but was -1.');
  });
});
