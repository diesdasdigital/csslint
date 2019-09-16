# csslint

Linter for our CSS architecture

### Css rules it checks:

- [x] no type selectors (with the only exception `> tag`)
- [x] no id selectors
- [x] component name is used on every class as a prefix
- [x] no multiple nesting in class names, eg `.component__one__two` is ill-formed
- [x] animation names should start with the component name: `@keyframes my-component__my-animation { ...`

![Screen shot of error messages](diesdas-css-linter-screenshot.png)

# For Running the linter

To install all dependencies run:

```
yarn
```

Then, you can run the linter on a single file

```
yarn start example-css-files/example.css
```

on multiple files

```
yarn start example-css-files/example.css example-css-files/example2.css
```

or you can use a glob pattern like

```
yarn start **/*.css
```

## Ignoring errors

In your projects root folder, create a file named `.csslintignore`.
The files in there will be ignored.

Alternatively you can ignore a single line by writing the following comment in the previous line:

```
/* csslint-disable-next-line */
```

# For Development

## Requirements

- macOS
- [`node`](https://nodejs.org/en/) (we recommend installing it via [nvm](https://github.com/creationix/nvm))
- [`yarn`](https://yarnpkg.com)

**_Note:_** _all of the following commands should be run in the project’s folder._
