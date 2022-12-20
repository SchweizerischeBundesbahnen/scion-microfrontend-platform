// This file is required by karma.conf.js and loads recursively all the .spec and framework files

export {};

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

const context = require.context('./', true, /\.spec\.ts$/);
context.keys().forEach(context);
