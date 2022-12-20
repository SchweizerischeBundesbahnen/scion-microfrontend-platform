/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

describe('Client Application Bundle', () => {

  it('should not contain files from the host module (tree shaking)', async () => {
    const files = await parseSourceMapExplorerStats();
    const hostFiles = files
      .filter(file => file.name.startsWith('webpack:///projects/scion/microfrontend-platform/src/lib/host'))
      .map(file => file.name);

    expect(hostFiles.length)
      .withContext(`Expected client application bundle not to contain files from the host module: ${hostFiles}`)
      .toBe(0);
  });

  it('should not be greater than 50 KB', async () => {
    const files = await parseSourceMapExplorerStats();
    const microfrontendPlatformBytes = files
      .filter(file => file.name.startsWith('webpack:///projects/scion/microfrontend-platform'))
      .reduce((bytes, file) => bytes + file.size, 0);

    expect(microfrontendPlatformBytes)
      .withContext(`Expected raw size of '@scion/microfrontend-platform' in client application not to exceed 50 KB, but was ${microfrontendPlatformBytes / 1000} KB`)
      .toBeLessThan(50_000);

    console.log(`Raw size of '@scion/microfrontend-platform' in client application: ${microfrontendPlatformBytes / 1000} KB.`);
  });
});

/**
 * Parses the output of the "Source Map Explorer" to analyze the files contained in the bundled application.
 */
async function parseSourceMapExplorerStats(): Promise<IFile[]> {
  // @ts-ignore: file only exists after executed `microfrontend-platform:analyze`
  const output: SourceMapExplorerOutput = await import('dist/microfrontend-platform-client-application-bundle-analyzer/stats.json');
  const files = new Array<IFile>();
  output.results.forEach(result => {
    Object.entries(result.files).forEach(([name, {size}]) => files.push({name, size}));
  });
  return files;
}

interface IFile {
  name: string;
  size: number;
}

interface SourceMapExplorerOutput {
  results: Array<{
    bundleName: string;
    totalBytes: number;
    mappedBytes: number;
    eolBytes: number;
    sourceMapCommentBytes: number;
    files: {
      [file: string]: {size: number};
    };
  }>;
}
