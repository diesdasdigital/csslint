# lint-css

Linter for our CSS architecture

### checks:

- [x] file name is used on every class as a prefix
- [x] doesn’t use ids (`#name`)
- [x] doesn’t have double nesting, eg `.component__one__two`
- [x] show the line of the file which caused the error
- [ ] doesn’t use tags (or only `> tag`)
- [ ] uses double underscore for element classes `__`

### general:

- [ ] use [node-glob](https://github.com/isaacs/node-glob)
- [ ] should exit with an error code if there is an error (`exit 1`)
- [ ] publish as npm package

---

## Requirements

- macOS
- [`node`](https://nodejs.org/en/) (we recommend installing it via [nvm](https://github.com/creationix/nvm))
- [`yarn`](https://yarnpkg.com)

**_Note:_** _all of the following commands should be run in the project’s folder._

## Installation

To install all dependencies run:

```
yarn
```

## Development

To run the linter on the example.css

```
yarn start
```
