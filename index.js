const fs = require("fs");
const path = require("path");
const csstree = require("css-tree");

function lint(filePath) {
	fs.readFile(filePath, "utf8", (err, str) => {
		if (err) throw err;
		const fileName = path.basename(filePath, ".css");
		lintFile(fileName, str);
	});
}

function lintFile(fileName, str) {
	const ast = csstree.parse(str, {
		positions: true
	});

	const errorMessages = [];
	const addErrorMessage = maybeErrorMessage => {
		if (maybeErrorMessage) {
			errorMessages.push(maybeErrorMessage);
		}
	};
	csstree.walk(ast, function(node) {
		addErrorMessage(checkIfUsesIdSelector(node));
		addErrorMessage(checkIfHasDoubleNesting(node));
		addErrorMessage(checkIfStartsWithFileName(fileName, node));
	});

	console.log(errorMessages);
	// console.log(JSON.stringify(ast, null, 2));
}

function checkIfUsesIdSelector(node) {
	if (node.type === "IdSelector") {
		return (
			"🔴 on line " +
			node.loc.start.line +
			": uses id selector: #" +
			node.name
		);
	}
}

function checkIfHasDoubleNesting(node) {
	if (node.type === "ClassSelector") {
		const matches = node.name.match(/__/g);
		const hasDoubleNesting = matches ? matches.length > 1 : false;
		if (hasDoubleNesting) {
			return (
				"🔴 on line " +
				node.loc.start.line +
				": double nesting in class selector: ." +
				node.name
			);
		}
	}
}
function checkIfStartsWithFileName(fileName, node) {
	if (node.type === "ClassSelector") {
		if (!node.name.startsWith(fileName)) {
			return (
				"🔴 on line " +
				node.loc.start.line +
				": the class selector does not start with file name: ." +
				node.name
			);
		}
	}
}

lint("example.css");
