"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("util");
require("reflect-metadata");
const process_1 = require("./models/process");
const request = require('request');
const url = require('url');
class TIProcess {
    constructor(client) {
        this.tm1client = client;
    }
    generateNewDefn(name, numParams, numVars, dsType) {
        let defn = Object.assign(new process_1.TIProcessDefn(), process_1.TIProcessDefn.prototype);
        defn.Parameters = [];
        defn.Variables = [];
        defn.Name = name;
        defn.DataSource = Object.assign(new process_1.TIProcessDataSource(), process_1.TIProcessDataSource.prototype);
        for (let i = 0; i < numParams; i++) {
            let param = new process_1.TIProcessParameter();
            param.Prompt = "";
            param.Name = `P${i}`;
            param.Type = "Numeric";
            param.Value = 0;
            defn.Parameters.push(param);
        }
        // Initialize variables.
        for (let i = 0; i < numVars; i++) {
            let newVar = new process_1.TIProcessVariable();
            newVar.Name = `V${i}`;
            newVar.Type = "Numeric";
            newVar.Position = i + 1;
            defn.Variables.push(newVar);
        }
        if (util_1.isNullOrUndefined(dsType) || dsType.length === 0)
            dsType = process_1.TIProcessDataSourceType.None;
        defn.DataSource.Type = dsType;
        this.cleanDataSource(defn.DataSource);
        return defn;
    }
    cleanDataSource(datasource) {
        if (datasource.Type !== process_1.TIProcessDataSourceType.ASCII) {
            delete datasource.asciiThousandSeparator;
            delete datasource.asciiQuoteCharacter;
            delete datasource.asciiHeaderRecords;
            delete datasource.asciiDelimiterType;
            delete datasource.asciiDecimalSeparator;
            delete datasource.asciiDelimiterChar;
        }
        if (datasource.Type === process_1.TIProcessDataSourceType.None) {
            delete datasource.dataSourceNameForClient;
            delete datasource.dataSourceNameForServer;
        }
        if (datasource.Type !== process_1.TIProcessDataSourceType.TM1CubeView) {
            delete datasource.view;
        }
        if (datasource.Type !== process_1.TIProcessDataSourceType.TM1DimensionSubset) {
            delete datasource.subset;
        }
        if (datasource.Type !== process_1.TIProcessDataSourceType.ODBC) {
            delete datasource.query;
            delete datasource.usesUnicode;
            delete datasource.userName;
            delete datasource.password;
        }
    }
    createProcess(processDefn, connection) {
        try {
            if (processDefn.Name === "" || util_1.isNullOrUndefined(processDefn.Name)) {
                vscode.window.showErrorMessage("Process name is required.");
                return;
            }
            // If this is not a PA instance, but rather an older version (e.g. TM1 10.2.2), we need to remove the "Type" property
            // from the process parameters. This is because it was not supported in older versions and will make the request fail if we include them.
            // Process parameters will just default to string type.
            if (connection.isPlanningAnalytics === false && util_1.isNullOrUndefined(processDefn.Parameters) === false && processDefn.Parameters.length > 0) {
                for (let p of processDefn.Parameters) {
                    delete p.Type;
                }
            }
            // If no datasource is specified, create a default one.
            if (util_1.isNullOrUndefined(processDefn.DataSource) === true)
                processDefn.DataSource = new process_1.TIProcessDataSource();
            // If no datasource type is specified, default to "None".
            if (util_1.isNullOrUndefined(processDefn.DataSource.Type) === true || processDefn.DataSource.Type === "")
                processDefn.DataSource.Type = process_1.TIProcessDataSourceType.None;
            this.cleanDataSource(processDefn.DataSource);
            if (processDefn.DataSource.Type === process_1.TIProcessDataSourceType.ASCII) {
                // TODO: perform more validation
                if (util_1.isNullOrUndefined(processDefn.DataSource.asciiDecimalSeparator) === true || processDefn.DataSource.asciiDecimalSeparator === "")
                    processDefn.DataSource.asciiDecimalSeparator = ".";
            }
            this.tm1client.post("/api/v1/Processes", JSON.stringify(processDefn), connection);
        }
        catch (e) {
            vscode.window.showErrorMessage(e.name + ': ' + e.message);
        }
    }
}
exports.TIProcess = TIProcess;
//# sourceMappingURL=tiprocess.js.map