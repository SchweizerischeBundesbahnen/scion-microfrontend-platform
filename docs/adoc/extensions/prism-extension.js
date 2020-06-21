const asciidoctor = require('@asciidoctor/core')();
const prismExtension = require('asciidoctor-prism-extension');

// Install 'asciidoctor-prism-extension' for highlighting code listings with Prism.js
// See https://www.npmjs.com/package/asciidoctor-prism-extension
module.exports.register = () => {
  console.log('Installing asciidoctor-prism-extension for highlighting code listings with Prism.js.');
  asciidoctor.SyntaxHighlighter.register('prism', prismExtension);

  // Add special CSS classes for each keyword matched in the code (see docinfo.html for custom styling)
  Prism.hooks.add('wrap', function(env) {
    if (env.type !== 'keyword') {
      return;
    }
    env.classes.push('keyword-' + env.content);
  });
};
