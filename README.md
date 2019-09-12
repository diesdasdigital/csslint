# lint-css

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

Then, you can run the linter one a single file

```
yarn start 'example-css-files/example.css'
```

or you can use a glob pattern like

```
yarn start '**/*.css'
```

# For Development

## Requirements

- macOS
- [`node`](https://nodejs.org/en/) (we recommend installing it via [nvm](https://github.com/creationix/nvm))
- [`yarn`](https://yarnpkg.com)

**_Note:_** _all of the following commands should be run in the project’s folder._
