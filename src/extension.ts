// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';

import * as vscode from 'vscode';
import * as tm1Client from './tm1client';
import * as tiprocess from './tiprocess';
import { Markdown } from './markdown';
import { TIProcessDefn, TIProcessDataSourceType } from './models/process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    type buildConnectionCallback = (connection: tm1Client.TM1Connection) => any;

    let client = new tm1Client.TM1Client();
    let tiProcess = new tiprocess.TIProcess(client);
    let markdown = new Markdown();

    let buildConnection = function(connName: string, callback: buildConnectionCallback) {
        // Prompt for the OData URL.
        vscode.window.showInputBox({prompt: "Enter OData URL (example: http://localhost:1234)", placeHolder: "OData URL", ignoreFocusOut: true }).then((url: string) => {
            let quickPickOpts = {
                placeHolder: "Select connection type",
                ignoreFocusOut: true
            }

            if (!url || url === "") {
                vscode.window.showErrorMessage(`OData URL is required`);
                return;
            }

            let connTypes = ["CAM", "Basic"];
            vscode.window.showQuickPick(connTypes, quickPickOpts).then((connType: string) => {
                if (connTypes.indexOf(connType) === -1) {
                    vscode.window.showErrorMessage(`Invalid connection type: ${connType}`);
                    return;
                }

                // Prompt for username.
                vscode.window.showInputBox({prompt: "Enter TM1 username", placeHolder: "TM1 username", ignoreFocusOut: true}).then((username: string) => {
                    if (!username || username === "") {
                        vscode.window.showErrorMessage(`Username is required`);
                        return;
                    }

                    // Prompt for password.
                    vscode.window.showInputBox({prompt: "Enter TM1 password", placeHolder: "TM1 password", ignoreFocusOut: true}).then((password: string) => {
                        let connection = new tm1Client.TM1Connection();
                        connection.Name = connName;
                        connection.Url = url;
                        connection.Username = username;
                        connection.Password = password;
                        // Remove trailing slash, if present.
                        if (connection.Url.endsWith("/"))
                            connection.Url = connection.Url.substr(0, connection.Url.length - 1);
                
                        if (connType === "CAM") { // If connecting using CAM, prompt for CAM namespace also
                            vscode.window.showInputBox({prompt: "Enter CAM namespace", placeHolder: "CAM namespace (example: LDAP)", ignoreFocusOut: true}).then((namespace: string) => {
                                if (!namespace || namespace === "") {
                                    vscode.window.showErrorMessage(`CAM namespace is required`);
                                    return;
                                }

                                connection.CAMNamespace = namespace;
                                connection.ConnectionType = "CAM";
                                callback(connection);
                            });
                        } else {
                            connection.ConnectionType = "Basic";
                            callback(connection);
                        }
                    });
                });
            });
        });
    }

    // This command is useful when you have a multi-line string value that you need to use in a JSON document.
    // An example would be the prolog procedure for a TI script. This command will flatten the text, while preserving
    // the line break characters in the flattened string.
    let cmdRemoveLineBreaks = vscode.commands.registerCommand('extension.RemoveLineBreaks', () => {
        let editor = vscode.window.activeTextEditor;
		let doc = editor.document;
        let text = doc.getText();
        text = text.replace(/(\r\n|\n|\r)/gm,"\\r\\n");
        editor.edit((e) => {
            var firstLine = editor.document.lineAt(0);
            var lastLine = editor.document.lineAt(editor.document.lineCount - 1);
            var textRange = new vscode.Range(0,  firstLine.range.start.character, editor.document.lineCount - 1, lastLine.range.end.character);
            e.replace(textRange, text);
        });
    });

    context.subscriptions.push(cmdRemoveLineBreaks);

    let cmdNewTM1Connection = vscode.commands.registerCommand('extension.NewConnection', () => {
        // Prompt for connection name.
        vscode.window.showInputBox({prompt: "Enter Connection Name", placeHolder: "Connection Name (example: Prod)", ignoreFocusOut: true}).then((connName: string) => {
            if (!connName || connName === "") {
                vscode.window.showErrorMessage(`Connection name is required`);
                return;
            }

            buildConnection(connName, (connection) => {
                client.addConnection(connection);
            });
        });
    });

    context.subscriptions.push(cmdNewTM1Connection);

    // Generates new TI process definition template.
    let cmdNewTIDefn = vscode.commands.registerCommand('extension.NewTIProcessTemplate', () => {
        // Prompt for process name.
        vscode.window.showInputBox({ prompt: "Enter Process Name", placeHolder: "Process Name", ignoreFocusOut: true }).then((name: string) => {
            if (!name || name === "") {
                vscode.window.showErrorMessage(`Process name is required`);
                return;
            }

            // Prompt for the number of parameters.
            vscode.window.showInputBox({ prompt: "Number of Process Parameters", placeHolder: "Number of Process Parameters", ignoreFocusOut: true }).then((paramCountStr: string) => {
                let paramCount = Number.parseInt(paramCountStr);
                if (isNaN(paramCount))
                    paramCount = 0;

                // Prompt for the number of variables.
                vscode.window.showInputBox({ prompt: "Number of Process Variables", placeHolder: "Number of Process Variables", ignoreFocusOut: true }).then((varCountStr: string) => {
                    let varCount = Number.parseInt(varCountStr);
                    if (isNaN(varCount))
                        varCount = 0;

                    let dsTypes = Object.keys(TIProcessDataSourceType);
                    let quickPickOpts = {
                        placeHolder: "Select data source type",
                        ignoreFocusOut: true
                    }

                    vscode.window.showQuickPick(dsTypes, quickPickOpts).then((dsType: string) => {
                        vscode.workspace.openTextDocument({language: "markdown" })
                        .then(doc => vscode.window.showTextDocument( doc )
                        .then( editor => {
                            // Create new TI process definition and get a JSON string back.
                            let defn = tiProcess.generateNewDefn(name, paramCount, varCount, dsType);
                            let str = markdown.serialize(defn);
                            editor.insertSnippet(new vscode.SnippetString(str)); // Set editor content
                        }));
                    });
                });
            });
        });
    });

    context.subscriptions.push(cmdNewTIDefn);

    // Creates a new TI process on the TM1 server from the specified definition.
    let cmdCreateTIProcess = vscode.commands.registerCommand('extension.CreateTIProcess', () => {
        let editor = vscode.window.activeTextEditor;
		let doc = editor.document;
		let text = doc.getText();
        if (!text || text === "") {
            vscode.window.showErrorMessage(`Unable to create TI process. No definition is specified.`);
            return;
        }
        let procDefn;
        let procDefnJson;
        try {
            procDefn = markdown.deserialize(text, TIProcessDefn.prototype);
            procDefnJson = JSON.stringify(procDefn);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Error occurred while processing markdown. ${err}`);
            return;
        }
   
        // If we have saved connections, prompt the user to pick one.
        let connections = client.getConnectionNames();
        if (connections.length > 0) {
            vscode.window.showQuickPick(connections, { placeHolder: "Select the Target TM1 Connection", ignoreFocusOut: true }).then((connName: string) => {
                let connection = null;
                if (connName && connName !== "") 
                    connection = client.getConnectionByName(connName);

                if (!connection) {
                    vscode.window.showErrorMessage(`Invalid TM1 connection specified.`);
                    return;
                }

                tiProcess.createProcess(procDefn, connection);
            });
        } else {
            // If no saved connections, prompt the user to specify connection information.
            buildConnection("", (connection) => {
                var callback = (options) => {
                    tiProcess.createProcess(procDefn, connection);
                };
        
                client.checkTM1Version(connection, callback);
            });
        }
    });

    context.subscriptions.push(cmdCreateTIProcess);
}

// this method is called when your extension is deactivated
export function deactivate() {}
