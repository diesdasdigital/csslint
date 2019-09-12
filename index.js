const fs = require("fs");
const path = require("path");
const csstree = require("css-tree");
const colors = require("colors/safe");
const glob = require("glob");

// the argument is a glob pattern
const firstArgumentInCommandLine = process.argv[2]
  ? process.argv[2]
  : "**/*.css";

glob(firstArgumentInCommandLine, null, (err, matchedFilePaths) => {
  if (err) {
    throw err;
  }
  for (const filePath of matchedFilePaths) {
    lint(filePath);
  }
});

function lint(filePath) {
  fs.readFile(filePath, "utf8", (err, str) => {
    if (err) {
      throw err;
    }

    const fileName = path.basename(filePath, ".css");

    const lintErrors = findLintErrors(fileName, str);

    if (lintErrors.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `
${colors.underline.red(`${lintErrors.length} errors in file ${filePath}`)}:
        `
      );

      for (const lintError of lintErrors) {
        // eslint-disable-next-line no-console
        console.log(lintError);
      }

      process.exit(1);
    } else {
      console.log(`No errors in file ${colors.green(filePath)}`);
    }
  });
}

function findLintErrors(fileName, str) {
  const ast = csstree.parse(str, {
    positions: true
  });

  // eslint-disable-next-line no-console, no-magic-numbers
  // console.log(JSON.stringify(ast, null, 2));

  const lintErrors = [];

  function addErrorMessage(maybeErrorMessage) {
    if (maybeErrorMessage !== "no error") {
      lintErrors.push(maybeErrorMessage);
    }
  }

  csstree.walk(ast, function(node, item) {
    // eslint-disable-next-line no-invalid-this
    const nodeContext = this;

    addErrorMessage(checkIfUsesIdSelector(node));
    addErrorMessage(checkIfNestedMoreThanOnce(node));
    addErrorMessage(checkIfStartsWithComponentName(fileName, node));
    addErrorMessage(checkIfAnimationStartsWithComponentName(fileName, node));
    addErrorMessage(
      checkIfHasATypeSelectorUsedInAWrongWay(nodeContext, node, item)
    );
  });

  // eslint-disable-next-line no-console
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
        ${colors.red(node.name)}.
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
        ${colors.red(node.name)}.
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
    !node.name.startsWith(`${componentName}__`)
  ) {
    return `🔴 on line ${node.loc.start.line}: 
      The class name 
        ${colors.red(node.name)}
      does not start with the component name.
      The name of the file is ${colors.blue(fileName)}.
      Your class names which differ from ${colors.blue(
        componentName
      )} should start with ${colors.blue(`${componentName}__`)}.
      Renaming your class as
        ${colors.green(`${componentName}__${node.name}`)} 
      would solve the problem.`;
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
      )}.
      Renaming your animation as
        ${colors.green(`${componentName}__${animationName}`)} 
      would solve the problem.`;
    }
  }

  return "no error";
}

/* 
    Type selectors (like "div", "ul", "li", ...) are only allowed 
      if they appear on the right hand side of a child combinator (like "my--form__list > li")
*/
function checkIfHasATypeSelectorUsedInAWrongWay(nodeContext, node, item) {
  if (
    node.type === "TypeSelector" &&
    nodeContext.atrule === null &&
    (!item.prev ||
      (item.prev &&
        !(item.prev.data.type === "Combinator" && item.prev.data.name === ">")))
  ) {
    return `🔴 on line ${node.loc.start.line}:
      I see the type selector ${colors.red(node.name)}.
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
  const matches = nodeName.match(/__/g);

  return matches ? matches.length > 1 : false;
}
