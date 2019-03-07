'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
let fs = require('fs');
let peg = require('pegjs');
class MdxFormatter {
    constructor() { }
    formatMDX() {
        let path = vscode.extensions.getExtension('whiteducksoftware.vscode-tm1client').extensionPath;
        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        let docContent = doc.getText(editor.selection);
        try {
            let parser = peg.generate(fs.readFileSync(path + '\\mdx-language\\formatmdx.pegjs', 'utf-8'));
            let output = parser.parse(docContent);
            editor.edit((e) => {
                e.replace(editor.selection, output);
            });
        }
        catch (e) {
            vscode.window.showErrorMessage(e.name + ': ' + e.message);
            console.log(e);
        }
    }
}
exports.MdxFormatter = MdxFormatter;
//# sourceMappingURL=formatMdx.js.map