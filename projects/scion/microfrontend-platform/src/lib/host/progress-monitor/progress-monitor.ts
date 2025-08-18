/*
 * Copyright (c) 2018-2021 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {BehaviorSubject, combineLatest, OperatorFunction, Subject} from 'rxjs';
import {distinctUntilChanged, map, takeUntil, takeWhile} from 'rxjs/operators';

/**
 * Represents a monitor to track the progress of some work.
 *
 * A monitor can be split into child monitors, allowing the work to be broken down into smaller units,
 * with each child monitor contributing to the overall progress of the parent monitor.
 *
 * @internal
 */
export class ProgressMonitor {

  private _progress$ = new BehaviorSubject<number>(0);
  private _done$ = new Subject<void>();
  private _hasSubMonitors = false;

  /**
   * Reports the current progress of this monitor in percent.
   *
   * Upon subscription, emits the current progress, and then continuously as the progress advances.
   * At 100%, the Observable completes.
   */
  public readonly progress$ = this._progress$.pipe(
    distinctUntilChanged(),
    map(progress => Math.round(progress * 10000) / 100),
    takeWhile(progress => progress < 100, true),
  );

  /**
   * Splits this monitor into separate child monitors for breaking down this monitor's work into smaller units.
   *
   * Each child monitor contributes to the overall progress of this monitor. The ratio allows child monitors to be
   * weighted differently, for example, one child monitor can contribute twice as much as another to the overall progress.
   * After all child monitors reported "done", this monitor will also enter "done".
   */
  public split(...ratio: number[]): ProgressMonitor[] {
    if (this._hasSubMonitors) {
      throw Error('[IllegalMonitorStateError] Monitor cannot be split multiple times.');
    }
    this._hasSubMonitors = true;

    const subMonitors = ratio.map(() => new ProgressMonitor());
    combineLatest(subMonitors.map(subMonitor => subMonitor._progress$))
      .pipe(
        computeProgress(ratio),
        takeWhile(progress => progress < 1, true),
        takeUntil(this._done$),
      )
      .subscribe(progress => {
        this._progress$.next(progress);
      });

    return subMonitors;
  }

  /**
   * Like {@link split}, but creates `n` child monitors with the same weight.
   */
  public splitEven(n: number): ProgressMonitor[] {
    if (n <= 0) {
      throw Error(`[IllegalMonitorArgumentError] Monitor split count must be greater than 0, but was ${n}.`);
    }
    return this.split(...new Array<number>(n).fill(1));
  }

  /**
   * Completes this monitor, setting its progress to '100%'.
   * Has no effect if this monitor is already "done".
   */
  public done(): void {
    this._progress$.next(1);
    this._done$.next();
  }
}

function computeProgress(ratio: number[]): OperatorFunction<number[], number> {
  const ratioSum = ratio.reduce((sum, weight) => sum + weight, 0);
  return map((subMonitorsProgress: number[]) => {
    return ratio.reduce((totalProgress, subMonitorWeight, subMonitorIndex) => {
      return totalProgress + subMonitorsProgress[subMonitorIndex]! * (subMonitorWeight / ratioSum);
    }, 0);
  });
}
