const fs = require("fs");
const path = require("path");
const csstree = require("css-tree");

// eslint-disable-next-line no-console
const filePathArgument = process.argv[2] ? process.argv[2] : "example.css";

lint(filePathArgument);

function lint(filePath) {
  fs.readFile(filePath, "utf8", (err, str) => {
    if (err) {
      throw err;
    }
    const fileName = path.basename(filePath, ".css");
    lintFile(fileName, str);
  });
}

/* 
    
*/
function lintFile(fileName, str) {
  const ast = csstree.parse(str, {
    positions: true
  });

  const errorMessages = [];
  const addErrorMessage = maybeErrorMessage => {
    if (maybeErrorMessage !== "no error") {
      errorMessages.push(maybeErrorMessage);
    }
  };

  csstree.walk(ast, node => {
    addErrorMessage(checkIfUsesIdSelector(node));
    addErrorMessage(checkIfHasDoubleNesting(node));
    addErrorMessage(checkIfStartsWithFileName(fileName, node));
  });

  // eslint-disable-next-line no-console
  errorMessages.map(msg => console.log(msg));

  // eslint-disable-next-line no-console
  // console.log(JSON.stringify(ast, null, 2));
}

// ------ EACH FUNCTION BELOW CHECKS A RULE

/* 
    Id selectors are not allowed.
*/
function checkIfUsesIdSelector(node) {
  return node.type === "IdSelector"
    ? `🔴 on line ${node.loc.start.line}: uses id selector: #${node.name}`
    : "no error";
}

/* 
    Nesting elements to blocks is not allowed.
    For example, the class name ".block__one__two" is ill-formed.
*/
function checkIfHasDoubleNesting(node) {
  function hasDoubleNesting() {
    const matches = node.name.match(/__/g);
    return matches ? matches.length > 1 : false;
  }

  return node.type === "ClassSelector" && hasDoubleNesting()
    ? `🔴 on line ${node.loc.start.line}: double nesting in class selector: .${node.name}`
    : "no error";
}

/* 
    Class names should start with file name.
    For example, every class name in the file "SearchField.css" should start with "search-field"
*/
function checkIfStartsWithFileName(fileName, node) {
  const camelCaseToDashes = str =>
    str
      .split(/(?=[A-Z])/)
      .join("_")
      .toLowerCase();

  return node.type === "ClassSelector" &&
    !node.name.startsWith(camelCaseToDashes(fileName))
    ? `🔴 on line ${node.loc.start.line}: the class selector does not start with file name: .${node.name}`
    : "no error";
}
