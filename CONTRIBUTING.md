<a href="/README.md"><img src="/resources/branding/scion-microfrontend-platform-banner.svg" height="50" alt="SCION Microfrontend Platform"></a>

| [SCION Microfrontend Platform][menu-home] | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | Contributing | [Sponsoring][menu-sponsoring] |  
| --- | --- | --- | --- | --- |

## Contributing
We encourage other developers to join the project and contribute to making SCION products constantly better and more stable. If you are missing a feature, please create a feature request so we can discuss it and coordinate further development. To report a bug, please check existing issues first, and if found, leave a comment on the issue. Otherwise, file a bug or create a pull request with a proposed fix.

<details>
  <summary><strong>Submitting a Pull Request</strong></summary>
  <br>
  
This section explains how to submit a pull request.

1. Login to your GitHub account and fork the `SchweizerischeBundesbahnen/scion-microfrontend-platform` repo.
1. Make your changes in a new Git branch. Name your branch in the form `issue/123` with `123` as the related GitHub issue number. Before submitting the pull request, please make sure that you comply with our coding and commit guidelines.
1. Run the command `npm run before-push` to make sure that the project builds, passes all tests, and has no lint violations. Alternatively, you can also run the commands one by one, as following:
   - `npm run lint`\
      Lints all project files.
   - `npm run build`\
      Builds the project and related artifacts.
   - `npm run test:headless`\
      Runs all unit tests.
   - `npm run e2e:headless`\
      Runs all end-to-end tests.
1. Commit your changes using a descriptive commit message that follows our commit guidelines.
1. Before submitting the pull request, ensure to have rebased your branch based on the master branch as we stick to the rebase policy to keep the repository history linear. 
1. Push your branch to your fork on GitHub. In GitHub, send a pull request to `scion-microfrontend-platform:master`.
1. If we suggest changes, please amend your commit and force push it to your GitHub repository.

> When we receive a pull request, we will carefully review it and suggest changes if necessary. This may require triage and several iterations. Therefore, we kindly ask you to discuss proposed changes with us in advance via the GitHub issue.

</details>

<details>
  <summary><strong>Development</strong></summary>
  <br>

Make sure to use Node.js version 20.9.0 for contributing to SCION. We suggest using [Node Version Manager](https://github.com/nvm-sh/nvm) if you need different Node.js versions for other projects.

For development, you can uncomment the section `PATH-OVERRIDE-FOR-DEVELOPMENT` in `tsconfig.json`. This allows running tests or serving applications without having to build dependent modules first.

The following is a summary of commands useful for development of `scion-microfrontend-platform`. See file `package.json` for a complete list of available NPM scripts.
 
### Commands for working on the microfrontend-platform library
 
- `npm run microfrontend-platform:lint`\
  Lints the microfrontend-platform library.

- `npm run microfrontend-platform:build`\
  Builds the microfrontend-platform library.

- `npm run microfrontend-platform:test`\
  Runs unit tests of the microfrontend-platform library.
 
- `npm run microfrontend-platform:analyze`\
  Displays the content of the library if installed in a client app. Use to verify the library to be tree shaken correctly, i.e., that the host module is not included.

### Commands for running end-to-end tests

- `npm run e2e:run`\
  Runs end-to-end tests of the microfrontend platform. Prior to test execution, starts four instances of the `microfrontend-platform-testing-app`.

- `npm run e2e:debug`\
  Runs end-to-end tests of the microfrontend platform in debug mode. Prior to test execution, starts four instances of the `microfrontend-platform-testing-app`.

- `npm run e2e:lint`\
  Lints end-to-end tests.

### Commands for working on the testing application and devtools

- `npm run start`\
  Serves four instances of the `microfrontend-platform-testing-app` and the `microfrontend-platform-devtools`. Open the page http://localhost:4201 to load the microfrontend platform testing app into your browser.\
  Uncomment the section `PATH-OVERRIDE-FOR-DEVELOPMENT` in `tsconfig.json` to have hot module reloading support.

- `npm run microfrontend-platform-testing-app:lint`\
  Lints the `microfrontend-platform-testing-app`.

- `npm run microfrontend-platform-devtools:lint`\
  Lints the `microfrontend-platform-devtools`.

### Commands for generating the project documentation

- `npm run microfrontend-platform:adoc`\
  Use to build the reference documentation (Developer Guide), i.e., creates a HTML file from the AsciiDoc source files. The output is written to `dist/microfrontend-platform-developer-guide`.
  
- `npm run microfrontend-platform:typedoc`\
  Use to generate the API documentation (TypeDoc) for the SCION Microfrontend Platform library. The output is written to `dist/microfrontend-platform-api`.
  
- `npm run changelog`\
  Use to generate the changelog based on the commit history. The output is written to `CHANGELOG.md`, which will be included in `docs/site/changelog/changelog.md` using the template `docs/site/changelog/changelog.template.md`. 

</details>

<details>
  <summary><strong>Code Formatting</strong></summary>
  <br>

To ensure consistency within our code base, please use the following formatting settings.  
  
- **For IntelliJ IDEA**\
  Import the code style settings of `.editorconfig.intellij.xml` located in the project root.

- **For other IDEs**\
  Import the code style settings of `.editorconfig` located in the project root.
  
</details>

<details>
  <summary><strong>Coding Guidelines</strong></summary>
  <br>
  
In additional to the linting rules, we have the following conventions:

- We believe in the [Best practices for a clean and performant Angular application](https://medium.freecodecamp.org/best-practices-for-a-clean-and-performant-angular-application-288e7b39eb6f) and the [Angular Style Guide](https://angular.io/guide/styleguide).
- We expect line endings to be Unix style (LF) only. Please check your Git settings to not convert line endings to CRLF. You can run the following command to find files with `windows-style` line endings: `find . -type f | xargs file | grep CRLF`.
- Observable names are suffixed with the dollar sign (`$`) to indicate that it is an `Observable` which we must subscribe to and unsubscribe from.
- We use explicit public and private visibility modifiers (except for constructors) to make the code more explicit.
- We prefix private members with an underscore.
- We write each RxJS operator on a separate line, except when piping a single RxJS operator. Then, we write it on the same line as the pipe method.
- We avoid nested RxJS subscriptions.
- We document all public API methods, constants, functions, classes or interfaces.
- We structure the CSS selectors in CSS files similar to the structure of the companion HTML file and favor the direct descendant selector (`>`) over the non-restrictive descendant selector (` `), except if there are good reasons not to do it. This gives us a visual by only reading the CSS file. 
- When referencing CSS classes from within E2E tests, we always prefix them with `e2e-`. We never reference e2e prefixed CSS classes in stylesheets.

</details>

<details>
  <summary><strong>Commit Guidelines</strong></summary>
  <br>
  
We believe in a compact and well written Git commit history. Every commit should be a logically separated changeset. We use the commit messages to generate the changelog.
 
Each commit message consists of a **header**, a **summary** and a **footer**.  The header has a special format that includes a **type**, an optional **scope**, and a **subject**, as following:

```
<type>(<scope>): <subject>

[optional summary]

[optional footer]
```

<details>
  <summary><strong>Type</strong></summary>
  
- `feat`: new feature
- `fix`: bug fix
- `docs`: changes to the documentation
- `refactor`: changes that neither fixes a bug nor adds a feature
- `perf`: changes that improve performance
- `test`: adding missing tests, refactoring tests; no production code change
- `chore`: other changes like formatting, updating the license, removal of deprecations, etc
- `deps`: changes related to updating dependencies
- `ci`: changes to our CI configuration files and scripts
- `revert`: revert of a previous commit
- `release`: publish a new release
</details>

<details>
  <summary><strong>Scope</strong></summary>
  
The scope should be the name of the NPM package or application affected by the change.

The following scopes are allowed:
  
- `platform`: If the change affects the `@scion/microfrontend-platform` NPM package.
- `devtools`: If the change affects the `SCION DevTools` application.
- `testapp`: If the change only affects the internal test application.
</details>


<details>
  <summary><strong>Subject</strong></summary>
  
The subject contains a succinct description of the change and follows the following rules:
- written in the imperative, present tense ("change" not "changed" nor "changes")
- starts with a lowercase letter
- has no punctuation at the end
</details>

<details>
  <summary><strong>Summary</strong></summary>
  
The summary describes the change. You can include the motivation for the change and contrast this with previous behavior.  
</details>

<details>
  <summary><strong>Footer</strong></summary>
  
In the footer, reference the GitHub issue and optionally close it with the `Closes` keyword, as following:

```
closes #123
```

And finally, add notes about breaking changes, if there are any. Breaking changes start with the keyword `BREAKING CHANGE: `. The rest of the commit message is then used to describe the breaking change and should contain information about the migration.
  
```
BREAKING CHANGE: Removed deprecated API for xy.

To migrate:
- do xy
- do xy
  ```
</details>

</details>


<details>
  <summary><strong>Deprecation Policy</strong></summary>
  <br>

You can deprecate an API in any version. Deprecated APIs are only removed in a major release.

When deprecating API, mark it with the `@deprecated` JSDoc comment tag and include the current library version. Optionally, you can also specify which API to use instead, as following: 

```ts
/**
 * @deprecated since version 2.0. Use {@link otherMethod} instead.
 */
function someMethod(): void {
}

```  

</details>

<details>
  <summary><strong>Deployments</strong></summary>
  <br>
  
We deploy our documentations and applications to [Vercel](https://vercel.com/docs). Vercel is a cloud platform for static sites and serverless functions. Applications are deployed using the SCION collaborator account (scion.collaborator@gmail.com) under the [SCION organization](https://vercel.com/scion).

We have the following microfrontend-platform related projects:
- https://vercel.com/scion/scion-microfrontend-platform-api
- https://vercel.com/scion/scion-microfrontend-platform-developer-guide
- https://vercel.com/scion/scion-microfrontend-platform-getting-started-app
- https://vercel.com/scion/scion-microfrontend-platform-testing-app
- https://vercel.com/scion/scion-microfrontend-platform-devtools

</details>

<details>
  <summary><strong>NPM Packages</strong></summary>
  <br>
  
We publish our packages to the [NPM registry](https://www.npmjs.com/). Packages are published using the SCION collaborator account (scion.collaborator) under the [SCION organization](https://www.npmjs.com/org/scion).

We have the following microfrontend-platform related packages:
- https://www.npmjs.com/package/@scion/microfrontend-platform

</details>

<details>
  <summary><strong>Versioning</strong></summary>
  <br>

SCION Microfrontend Platform follows the semantic versioning scheme (SemVer) for its releases. For more information, see our [version policy][link-versioning].
  
</details>

<details>
  <summary><strong>Release Checklist</strong></summary>
  <br>

This chapter describes the tasks to publish a new release to NPM.

1. Update the following `package.json` files with the new version:
    - `/package.json`
    - `/projects/scion/microfrontend-platform/package.json`
    - ensure version constant in `projects/scion/microfrontend-platform/src/lib/microfrontend-platform.ts` to be the same version as in `/projects/scion/microfrontend-platform/package.json`.
1. Run `npm install` to update the version in `package-lock.json`.
1. Run `npm run changelog` to generate the changelog. Then, review the generated changelog carefully and correct typos and formatting errors, if any.
1. Commit the changed files using the following commit message: `release: vX.X.X`. Replace `X.X.X` with the current version. Later, when merging the branch into the master branch, a commit message of this format triggers the release action in our [GitHub Actions workflow][link-github-actions-workflow].
1. Push the commit to the branch `release/X.X.X` and submit a pull request to the master branch. Replace `X.X.X` with the current version.
1. When merged into the master branch, the release action in our [GitHub Actions workflow][link-github-actions-workflow] does the following:
   - Creates a Git release tag
   - Publishes `@scion/microfrontend-platform` package to NPM (https://www.npmjs.com/package/@scion/microfrontend-platform)
   - Creates a release on GitHub (https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/releases)
   - Deploys following apps to Vercel:
      - https://scion-microfrontend-platform-testing-app1-vX-X-X.vercel.app.
      - https://scion-microfrontend-platform-testing-app2-vX-X-X.vercel.app.
      - https://scion-microfrontend-platform-testing-app3-vX-X-X.vercel.app.
      - https://scion-microfrontend-platform-testing-app4-vX-X-X.vercel.app.
   - Deploys DevTools to Vercel:
      - https://scion-microfrontend-platform-devtools.vercel.app.
      - https://scion-microfrontend-platform-devtools-vX-X-X.vercel.app.
   - Publishes API Documentation (TypeDoc) to Vercel: 
      - https://scion-microfrontend-platform-api.vercel.app.
      - https://scion-microfrontend-platform-api-vX-X-X.vercel.app.
   - Publishes Reference Documentation (Developer Guide) to Vercel: 
      - https://scion-microfrontend-platform-developer-guide.vercel.app.
      - https://scion-microfrontend-platform-developer-guide-vX-X-X.vercel.app.
1. Migrate the [Getting Started Guide][link-getting-started-guide-repo] Git Repo if necessary.
 
</details>

[link-getting-started-guide-repo]: https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform-getting-started
[link-github-actions-workflow]: https://github.com/SchweizerischeBundesbahnen/scion-microfrontend-platform/actions
[link-versioning]: /docs/site/versioning.md

[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md
