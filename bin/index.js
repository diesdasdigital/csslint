#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const csstree = require("css-tree");
const colors = require("colors/safe");
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

try {
  const ignoredFiles = fs.readFileSync(".csslintignore", "utf8");
} catch (error) {}

const regexForDoubleLowDash = /__/g;

const matchedFilePaths = argv._;

if (argv.all) {
  const filePathsWithErrors = matchedFilePaths
    .map(filePath => ({ filePath, errors: lint(filePath) }))
    .filter(fileWithErrors => fileWithErrors.errors.length > 0);

  const numberOFFilesThatHaveErrors = filePathsWithErrors.length;

  const totalNumberOfErrors = filePathsWithErrors.reduce(
    (acc, fileWithErrors) => acc + fileWithErrors.errors.length,
    0
  );

  if (totalNumberOfErrors > 0) {
    // eslint-disable-next-line no-console
    console.error(
      colors.red(
        `I have found ${totalNumberOfErrors} errors in ${numberOFFilesThatHaveErrors} files: \n`
      )
    );

    for (const { filePath, errors } of filePathsWithErrors) {
      printErrors(filePath, errors);
    }

    process.exit(1);
  } else if (argv.verbose) {
    // eslint-disable-next-line no-console
    console.error(
      colors.green(
        `I have checked ${matchedFilePaths.length} files and found no erros \n`
      )
    );
  }
} else {
  for (const filePath of matchedFilePaths) {
    const lintErrors = lint(filePath);

    if (lintErrors.length > 0) {
      printErrors(filePath, lintErrors);

      process.exit(1);
    } else if (argv.verbose) {
      // eslint-disable-next-line no-console
      console.error(`No errors in file ${colors.green(filePath)}`);
    }
  }
}

function printErrors(filePath, lintErrors) {
  // eslint-disable-next-line no-console
  console.error(
    `${colors.underline.red(
      `${lintErrors.length} errors in file ${filePath}: \n`
    )}`
  );

  for (const lintError of lintErrors) {
    // eslint-disable-next-line no-console
    console.error(`${lintError} \n`);
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

  // console.log(JSON.stringify(ast, null, 2));

  const lintErrors = [];

  function maybeAddError(maybeErrorMessage) {
    if (maybeErrorMessage !== "no error") {
      lintErrors.push(maybeErrorMessage);
    }
  }

  csstree.walk(ast, function(node, item) {
    // eslint-disable-next-line no-invalid-this
    const nodeContext = this;

    maybeAddError(checkIfUsesIdSelector(node));
    maybeAddError(checkIfNestedMoreThanOnce(node));
    maybeAddError(checkIfStartsWithComponentName(fileName, node));
    maybeAddError(checkIfAnimationStartsWithComponentName(fileName, node));
    maybeAddError(checkIfUsesTypeSelector(nodeContext, node, item));
  });

  return lintErrors;
}

// EACH FUNCTION BELOW CHECKS A RULE:

/*
    Id selectors are not allowed.
*/
function checkIfUsesIdSelector(node) {
  if (node.type === "IdSelector") {
    return `🔴 on line ${node.loc.start.line}:
      There is an id selector:
        ${colors.red(`#${node.name}`)}
      Id selectors are not allowed.`;
  }

  return "no error";
}

/*
    Nesting elements to blocks is not allowed.
    For example, the class name ".block__one__two" is ill-formed.
*/
function checkIfNestedMoreThanOnce(node) {
  if (
    node.type === "ClassSelector" &&
    containsDoubleLowDashMoreThanOnce(node.name)
  ) {
    return `🔴 on line ${node.loc.start.line}:
      The class name
        ${colors.red(`.${node.name}`)}
      is nested more than once`;
  }

  return "no error";
}

/*
    Class names should start with file name.
    For example, every class name in the file "SearchField.css" should start with "search-field"
*/
function checkIfStartsWithComponentName(fileName, node) {
  const componentName = toComponentName(fileName);

  if (
    node.type === "ClassSelector" &&
    node.name !== componentName &&
    !node.name.startsWith(`${componentName}--`) &&
    !node.name.startsWith(`${componentName}__`)
  ) {
    return `🔴 on line ${node.loc.start.line}:
      The class name
        ${colors.red(`.${node.name}`)}
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
function checkIfAnimationStartsWithComponentName(fileName, node) {
  const componentName = toComponentName(fileName);

  if (node.type === "Atrule" && node.name === "keyframes") {
    const animationName = node.prelude.children.first().name;

    if (!animationName.startsWith(`${componentName}__`)) {
      return `🔴 on line ${node.loc.start.line}:
      The animation name
        ${colors.red(animationName)}
      does not start with the component name.
      The name of the file is ${colors.blue(fileName)}.
      Your animation names should start with ${colors.blue(
        `${componentName}__`
      )}`;
    }
  }

  return "no error";
}

/*
    Type selectors (like "div", "ul", "li", ...) are only allowed
      if they appear on the right hand side of a child combinator (like "my--form__list > li")
*/
function checkIfUsesTypeSelector(nodeContext, node, item) {
  if (
    node.type === "TypeSelector" &&
    nodeContext.atrule === null &&
    (!item.prev ||
      (item.prev &&
        !(item.prev.data.type === "Combinator" && item.prev.data.name === ">")))
  ) {
    return `🔴 on line ${node.loc.start.line}:
      I see the type selector ${colors.red(node.name)}
      Type selectors are only allowed if they appear on the right hand side of a child combinator.
      For example, like ${colors.green(`... > ${node.name}`)}`;
  }

  return "no error";
}

//  HELPERS:

/*
  Takes the file name (which is written with CamelCase)
    and turns it into the component name which is lowercase and separated by dashes.
  For example, if the files name is "SearchField.css" then the component name is "search-field".
*/
function toComponentName(fileName) {
  return fileName
    .split(/(?=[A-Z])/)
    .join("_")
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
