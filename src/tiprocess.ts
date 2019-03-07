import * as tm1client from './tm1client';
import * as vscode from 'vscode';
import { isNullOrUndefined } from 'util';
import { POINT_CONVERSION_COMPRESSED } from 'constants';
import "reflect-metadata"
import { TIProcessDefn, TIProcessDataSource, TIProcessParameter, TIProcessVariable, TIProcessDataSourceType } from './models/process'

const request = require('request');
const url = require('url');

export class TIProcess {
    private tm1client: tm1client.TM1Client;

    constructor(client: tm1client.TM1Client) {
        this.tm1client = client;
    }

    public generateNewDefn(name: string, numParams: number, numVars: number, dsType: string): TIProcessDefn {
        let defn = Object.assign(new TIProcessDefn(), TIProcessDefn.prototype);
        defn.Parameters = [];
        defn.Variables = [];
        defn.Name = name;
        defn.DataSource = Object.assign(new TIProcessDataSource(), TIProcessDataSource.prototype);

        for (let i = 0; i < numParams; i++) {
            let param = new TIProcessParameter();
            param.Prompt = "";
            param.Name = `P${i}`;
            param.Type = "Numeric";
            param.Value = 0;
            defn.Parameters.push(param);
        }
        // Initialize variables.
        for (let i = 0; i < numVars; i++) {
            let newVar = new TIProcessVariable();
            newVar.Name = `V${i}`;
            newVar.Type = "Numeric";
            newVar.Position = i + 1;
            defn.Variables.push(newVar);
        }

        if (isNullOrUndefined(dsType) || dsType.length === 0)
            dsType = TIProcessDataSourceType.None;

        defn.DataSource.Type = dsType;

        this.cleanDataSource(defn.DataSource);

        return defn;
    }

    private cleanDataSource(datasource: TIProcessDataSource) {
        if (datasource.Type !== TIProcessDataSourceType.ASCII) {
            delete datasource.asciiThousandSeparator;
            delete datasource.asciiQuoteCharacter;
            delete datasource.asciiHeaderRecords;
            delete datasource.asciiDelimiterType;
            delete datasource.asciiDecimalSeparator;
            delete datasource.asciiDelimiterChar;
        } 

        if (datasource.Type === TIProcessDataSourceType.None) {
            delete datasource.dataSourceNameForClient;
            delete datasource.dataSourceNameForServer;
        }

        if (datasource.Type !== TIProcessDataSourceType.TM1CubeView) {
            delete datasource.view;
        }

        if (datasource.Type !== TIProcessDataSourceType.TM1DimensionSubset) {
            delete datasource.subset;
        }

        if (datasource.Type !== TIProcessDataSourceType.ODBC) {
            delete datasource.query;
            delete datasource.usesUnicode;
            delete datasource.userName;
            delete datasource.password;
        }
    }

    public createProcess(processDefn: TIProcessDefn, connection: tm1client.TM1Connection) {
        try {
            if (processDefn.Name === "" || isNullOrUndefined(processDefn.Name)) {
                vscode.window.showErrorMessage("Process name is required.");
                return;
            }

            // If this is not a PA instance, but rather an older version (e.g. TM1 10.2.2), we need to remove the "Type" property
            // from the process parameters. This is because it was not supported in older versions and will make the request fail if we include them.
            // Process parameters will just default to string type.
            if (connection.isPlanningAnalytics === false && isNullOrUndefined(processDefn.Parameters) === false && processDefn.Parameters.length > 0) {
                for (let p of processDefn.Parameters) {
                    delete p.Type;
                }
            }
            // If no datasource is specified, create a default one.
            if (isNullOrUndefined(processDefn.DataSource) === true) 
                processDefn.DataSource = new TIProcessDataSource();
            // If no datasource type is specified, default to "None".
            if (isNullOrUndefined(processDefn.DataSource.Type) === true || processDefn.DataSource.Type === "")
                processDefn.DataSource.Type = TIProcessDataSourceType.None;

            this.cleanDataSource(processDefn.DataSource);
            if (processDefn.DataSource.Type === TIProcessDataSourceType.ASCII) {
                // TODO: perform more validation
                if (isNullOrUndefined(processDefn.DataSource.asciiDecimalSeparator) === true || processDefn.DataSource.asciiDecimalSeparator === "")
                    processDefn.DataSource.asciiDecimalSeparator = ".";
            }

            this.tm1client.post("/api/v1/Processes", JSON.stringify(processDefn), connection);
        }
        catch (e) {
            vscode.window.showErrorMessage(e.name + ': ' + e.message);
        }
    }
}