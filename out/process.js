"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require('request');
const url = require('url');
class TIProcess {
    GenerateNewDefn(name, numParams, numVars) {
        let defn = new TIProcessDefn();
        defn.Name = name;
        defn.HasSecurityAccess = false;
        defn.PrologProcedure = "";
        defn.MetadataProcedure = "";
        defn.DataProcedure = "";
        defn.EpilogProcedure = "";
        // Initialize datasource.
        defn.DataSource = new TIProcessDataSource();
        defn.DataSource.Type = "None";
        defn.DataSource.asciiDecimalSeparator = "";
        defn.DataSource.asciiDelimiterChar = ",";
        defn.DataSource.asciiDelimiterType = "Character";
        defn.DataSource.asciiHeaderRecords = 0;
        defn.DataSource.asciiQuoteCharacter = "\"";
        defn.DataSource.asciiThousandSeparator = ",";
        defn.DataSource.dataSourceNameForClient = "";
        defn.DataSource.dataSourceNameForServer = "";
        // Initialize parameters.
        defn.Parameters = [];
        // Initialize variables.
        defn.Variables = [];
        return JSON.stringify(defn, null, 4);
    }
}
exports.TIProcess = TIProcess;
class TIProcessVariable {
}
exports.TIProcessVariable = TIProcessVariable;
class TIProcessParameter {
}
exports.TIProcessParameter = TIProcessParameter;
class TIProcessDataSource {
}
exports.TIProcessDataSource = TIProcessDataSource;
class TIProcessDefn {
}
exports.TIProcessDefn = TIProcessDefn;
//# sourceMappingURL=process.js.map