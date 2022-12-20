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

/**
 * Tracks the progress of loading application manifests.
 *
 * @internal
 */
export abstract class ManifestLoadProgressMonitor extends ProgressMonitor {
}

/**
 * Tracks the progress of loading application activators.
 *
 * @internal
 */
export abstract class ActivatorLoadProgressMonitor extends ProgressMonitor {
}

/**
 * @internal
 */
export abstract class StartupProgressMonitor extends ProgressMonitor {
}
