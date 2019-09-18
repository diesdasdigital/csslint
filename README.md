# csslint [![npm badge](https://badgen.net/npm/v/@diesdasdigital/csslint)](https://www.npmjs.com/package/@diesdasdigital/csslint)

Linter for diesdas’ [CSS architecture](https://diesdas.digital/wiki/life-as-a-developer/how-we-write-css).

### CSS rules it checks:

- [x] component name is used on every class as a prefix
- [x] no multiple nesting in class names, eg `.component__one__two` is ill-formed
- [x] animation names should start with the component name: `@keyframes my-component__my-animation { ...`
- [x] no type selectors (with the only exception `> tag`)
- [x] no id selectors

![Screen shot of error messages](diesdas-css-linter-screenshot.png)

## Installation

To install all dependencies run:

```
yarn add @diesdasdigital/csslint --dev
```

Then you can run use the linter in `package.json` or via `npx`.

```json
{
  "scripts": {
    "lint": "csslint 'src/**/*.css'"
  }
}
```

## Collaboration

If you want to make changes to `csslint` you need to have the following tools:

or you can use a glob pattern like

```
yarn start '**/*.css'
```

## Ignoring errors

In your projects root folder, create a file named `.csslintignore`.
The files in there will be ignored.

Alternatively you can ignore a single line by writing the following comment in the previous line:

```
/* csslint-disable-next-line */
```

# For Development

### Requirements

- macOS
- [`node`](https://nodejs.org/en/) (we recommend installing it via [nvm](https://github.com/creationix/nvm))
- [`yarn`](https://yarnpkg.com)

**_Note:_** _all of the following commands should be run in the project’s folder._
