# csslint [![npm badge](https://badgen.net/npm/v/@diesdasdigital/csslint)](https://www.npmjs.com/package/@diesdasdigital/csslint)

Linter for diesdas’ [CSS architecture](https://diesdas.digital/wiki/life-as-a-developer/how-we-write-css).

### Rules it checks:

- [x] component name is used on every class as a prefix
- [x] no multiple nesting in class names, eg `.component__one__two` is ill-formed
- [x] animation names should start with the component name, eg `@keyframes component__my-animation`
- [x] no type selectors (with the only exception `> tag`)
- [x] no id selectors

![Screen shot of error messages](diesdas-css-linter-screenshot.png)

## Installation

To add it to your project use `npm` or `yarn`:

```
yarn add @diesdasdigital/csslint --dev
npm install @diesdasdigital/csslint --save-dev
```

Then you can use the linter via `npx` or in `package.json` scripts:

```json
{
  "scripts": {
    "lint": "csslint 'src/**/*.css' --all"
  }
}
```

## Flags

`--all`
doesn’t stop on the first invalid file and shows a summary of how many errors it found

`--verbose`
also logs all valid files it has checked

## Ignoring errors

In your projects root folder, create `.csslintignore` file, which includes new line separate file paths which should be ignored.

Alternatively you can ignore a single line inside of a file by writing the following comment in the previous line:

```
/* csslint-disable-next-line */
```

## Collaboration

If you want to create PR, we test and develop this tool using these as a baseline:

- macOS
- [`node`](https://nodejs.org/en/) (we recommend installing it via [nvm](https://github.com/creationix/nvm))
- [`yarn`](https://yarnpkg.com)
