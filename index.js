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

const checkIfUsesIdSelector = node =>
  node.type === "IdSelector"
    ? `🔴 on line ${node.loc.start.line}: uses id selector: #${node.name}`
    : "no error";

const checkIfHasDoubleNesting = node => {
  function hasDoubleNesting() {
    const matches = node.name.match(/__/g);
    return matches ? matches.length > 1 : false;
  }
  return node.type === "ClassSelector" && hasDoubleNesting()
    ? `🔴 on line ${node.loc.start.line}: double nesting in class selector: .${node.name}`
    : "no error";
};

const checkIfStartsWithFileName = (fileName, node) =>
  node.type === "ClassSelector" && !node.name.startsWith(fileName)
    ? `🔴 on line ${node.loc.start.line}: the class selector does not start with file name: .${node.name}`
    : "no error";

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
