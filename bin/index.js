#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const csstree = require("css-tree");
const colors = require("colors/safe");
const glob = require("glob");
const argv = require("yargs")
  .option("all", {
    type: "boolean",
    description: "Don't exit on error until all files are checked"
  })
  .option("verbose", {
    type: "boolean",
    description: "Run with verbose logging"
  })
  .showHelpOnFail(true)
  .demandCommand()
  .recommendCommands()
  .strict().argv;

const regexForDoubleLowDash = /__/g;

function getFilePathsToIgnore() {
  try {
    return fs
      .readFileSync(".csslintignore", "utf8")
      .split("\n")
      .map((lineContent) => lineContent.trim())
      .filter((trimmedLineContent) => trimmedLineContent !== "");
  } catch (error) {
    return [];
  }
}

const filePathsToIgnore = getFilePathsToIgnore();

glob(argv._[0], null, (error, matchedFilePaths) => {
  if (error) {
    console.error(error); // eslint-disable-line
    return;
  }

  const filePathsToLint = matchedFilePaths.filter(
    (filePath) => !filePathsToIgnore.includes(filePath)
  );

  if (argv.all) {
    const filePathsWithErrors = filePathsToLint.map((filePath) => ({
      filePath,
      errors: lint(filePath)
    }));

    const numberOFFilesThatHaveErrors = filePathsWithErrors.filter(
      (fileWithErrors) => fileWithErrors.errors.length > 0
    ).length;

    const totalNumberOfErrors = filePathsWithErrors.reduce(
      (acc, fileWithErrors) => acc + fileWithErrors.errors.length,
      0
    );

    if (totalNumberOfErrors > 0) {
      // eslint-disable-next-line
      console.error(
        colors.red(
          `❌ csslint found ${totalNumberOfErrors} errors in ${numberOFFilesThatHaveErrors} files:\n`
        )
      );

      for (const { filePath, errors } of filePathsWithErrors) {
        printErrors(filePath, errors, argv.verbose);
      }

      // eslint-disable-next-line
      console.error(
        colors.red(
          `❌ csslint found ${totalNumberOfErrors} errors in ${numberOFFilesThatHaveErrors} files.\n`
        )
      );

      process.exit(1);
    }
  } else {
    for (const filePath of filePathsToLint) {
      const lintErrors = lint(filePath);

      printErrors(filePath, lintErrors, argv.verbose);

      if (lintErrors.length > 0) {
        process.exit(1);
      }
    }
  }
});

function printErrors(filePath, lintErrors, verbose) {
  if (verbose && lintErrors.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`No errors in file ${filePath}`);
  }
  if (lintErrors.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `${colors.underline.red(
        `${lintErrors.length} errors in file ${filePath}: \n`
      )}`
    );
  }

  for (const lintError of lintErrors) {
    // eslint-disable-next-line no-console
    console.error(`${lintError}\n`);
  }
}

function lint(filePath) {
  const fileName = path.basename(filePath, ".css");
  const fileContent = fs.readFileSync(filePath, "utf8");
  return findLintErrors(fileName, fileContent);
}

function findLintErrors(fileName, fileContent) {
  const ast = csstree.parse(fileContent, {
    positions: true
  });

  // console.log(ast);

  const indicesOfIgnoredLines = getIndicesOfIgnoredLines(fileContent);

  const lintErrors = [];

  function maybeAddError(maybeErrorMessage) {
    if (maybeErrorMessage !== "no error") {
      lintErrors.push(maybeErrorMessage);
    }
  }

  if (fileName === "main") {
    ast.children.forEach((node) => {
      maybeAddError(shouldHaveOnlyImports(node));
    });
  }

  if (fileName !== "main") {
    csstree.walk(ast, function (node, item) {
      if (node.loc && !indicesOfIgnoredLines.includes(node.loc.start.line)) {
        // eslint-disable-next-line no-invalid-this
        const nodeContext = this;

        maybeAddError(shouldNotHaveImports(node));
        maybeAddError(shouldNotUseIdSelector(node));
        maybeAddError(classNameShouldNotBeNestedMoreThanOnce(node));
        maybeAddError(classNameShouldStartWithComponentName(fileName, node));
        maybeAddError(animationShouldStartWithComponentName(fileName, node));
        maybeAddError(shouldNotUseTypeSelector(nodeContext, node, item));
      }
    });
  }

  return lintErrors;
}

function getIndicesOfIgnoredLines(fileContent) {
  const indicesOfIgnoredLines = [];

  for (const [index, lineContent] of fileContent.split("\n").entries()) {
    if (
      lineContent.trim().startsWith("/*") &&
      lineContent.includes("csslint-disable-next-line")
    ) {
      indicesOfIgnoredLines.push(index + 1 + 1);
    }
  }

  return indicesOfIgnoredLines;
}

// EACH FUNCTION BELOW CHECKS A RULE:

/*
    Id selectors are not allowed.
*/
function shouldNotUseIdSelector(node) {
  if (node.type === "IdSelector") {
    return `  ${printLineNumber(node)}
  There is an id selector ${colors.red(`#${node.name}`)}
  Please use a class instead.`;
  }

  return "no error";
}

/*
    Nesting elements to blocks is not allowed.
    For example, the class name ".block__one__two" is ill-formed.
*/
function classNameShouldNotBeNestedMoreThanOnce(node) {
  if (
    node.type === "ClassSelector" &&
    containsDoubleLowDashMoreThanOnce(node.name)
  ) {
    return `  ${printLineNumber(node)}
  The class name ${colors.red(`.${node.name}`)} is nested more than once`;
  }

  return "no error";
}

/*
    Class names should start with file name.
    For example, every class name in the file "SearchField.css" should start with "search-field"
*/
function classNameShouldStartWithComponentName(fileName, node) {
  const componentName = toComponentName(fileName);

  if (
    node.type === "ClassSelector" &&
    node.name !== componentName &&
    !node.name.startsWith(`${componentName}--`) &&
    !node.name.startsWith(`${componentName}__`)
  ) {
    return `  ${printLineNumber(node)}
  The class name ${colors.red(`.${node.name}`)}
  does not start with the component name.
  The name of the file is ${colors.blue(fileName)}.
  Your class names which differ from ${colors.blue(
    componentName
  )} should start with ${colors.blue(`${componentName}__`)}`;
  }

  return "no error";
}

/*
    Animation names start with the component name.
    For example, every animation name in the file "SearchField.css" should start with "search-field__"
*/
function animationShouldStartWithComponentName(fileName, node) {
  const componentName = toComponentName(fileName);

  if (node.type === "Atrule" && node.name === "keyframes") {
    const animationName = node.prelude.children.first().name;

    if (!animationName.startsWith(`${componentName}__`)) {
      return `  ${printLineNumber(node)}
  The animation name ${colors.red(animationName)}
  does not start with the component name.
  The name of the file is ${colors.blue(fileName)}.
  The animation name should start with ${colors.blue(`${componentName}__`)}`;
    }
  }

  return "no error";
}

/*
    Type selectors (like "div", "ul", "li", ...) are not allowed.
*/
function shouldNotUseTypeSelector(nodeContext, node) {
  if (node.type === "TypeSelector" && nodeContext.atrule === null) {
    return `  ${printLineNumber(node)}
  There is a type selector ${colors.red(node.name)}`;
  }

  return "no error";
}

/*
    Imports are only allowed in main.css
*/
function shouldNotHaveImports(node) {
  if (node.type === "Atrule" && node.name === "import") {
    return `  ${printLineNumber(node)}
  Imports are only allowed in main.css.
  Having all imports in one file guarantees
  that there is only one place in the project
  to see which CSS files are loaded.
  It also improves the site’s performance,
  since the browser only needs to load one file
  to know which files it needs to load afterwards.`;
  }
  return "no error";
}

/*
    In main.css, only import rules are allowed.
*/
function shouldHaveOnlyImports(node) {
  if (!node.name || node.name !== "import") {
    return `  ${printLineNumber(node)}
  Your ${colors.blue(
    "main.css"
  )} file contains another rule than an import rule.
  ${colors.blue("main.css")} can only contain import rules and comments.`;
  }
  return "no error";
}

//  HELPERS:

/*
  The first line in every error message is the line number
*/
function printLineNumber(node) {
  return colors.underline(`on line ${node.loc.start.line}:`);
}

/*
  Takes the file name (which is written with CamelCase)
    and turns it into the component name which is lowercase and separated by dashes.
  For example, if the files name is "SearchField.css" then the component name is "search-field".
*/
function toComponentName(fileName) {
  return fileName
    .split(/(?=[A-Z])/)
    .join("-")
    .toLowerCase();
}

/*
  Takes a string and returns `true` if it contains the substring "__" more than once.
  Otherwise it returns `false`.
*/
function containsDoubleLowDashMoreThanOnce(nodeName) {
  const matches = nodeName.match(regexForDoubleLowDash);
  return matches ? matches.length > 1 : false;
}
