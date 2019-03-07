"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const markdown_1 = require("../markdown");
var TIProcessDataSourceType;
(function (TIProcessDataSourceType) {
    TIProcessDataSourceType["None"] = "None";
    TIProcessDataSourceType["ODBC"] = "ODBC";
    TIProcessDataSourceType["ASCII"] = "ASCII";
    TIProcessDataSourceType["TM1CubeView"] = "TM1CubeView";
    TIProcessDataSourceType["TM1DimensionSubset"] = "TM1DimensionSubset";
})(TIProcessDataSourceType = exports.TIProcessDataSourceType || (exports.TIProcessDataSourceType = {}));
;
class TIProcessVariable {
}
__decorate([
    Reflect.metadata("ValueRange", ["Numeric", "String"])
], TIProcessVariable.prototype, "Type", void 0);
exports.TIProcessVariable = TIProcessVariable;
TIProcessVariable.prototype.Name = "";
TIProcessVariable.prototype.Type = "";
TIProcessVariable.prototype.Position = 0;
TIProcessVariable.prototype.StartByte = 0;
TIProcessVariable.prototype.EndByte = 0;
class TIProcessParameter {
}
__decorate([
    Reflect.metadata("Position", 0)
], TIProcessParameter.prototype, "Name", void 0);
__decorate([
    Reflect.metadata("Placeholder", "<Prompt>"),
    Reflect.metadata("Position", 2)
], TIProcessParameter.prototype, "Prompt", void 0);
__decorate([
    Reflect.metadata("ValueRange", ["Numeric", "String"])
], TIProcessParameter.prototype, "Type", void 0);
__decorate([
    Reflect.metadata("Placeholder", "<Default_Value>"),
    Reflect.metadata("Position", 1)
], TIProcessParameter.prototype, "Value", void 0);
exports.TIProcessParameter = TIProcessParameter;
TIProcessParameter.prototype.Name = "";
TIProcessParameter.prototype.Prompt = "";
TIProcessParameter.prototype.Type = "";
TIProcessParameter.prototype.Value = 0;
class TIProcessDataSource {
}
__decorate([
    Reflect.metadata("Description", "Process datasource section. Value specified for the <Datasource_Name> placeholder" +
        " will be used to set the \"dataSourceNameForClient\" and \"dataSourceNameForServer\" fields."),
    Reflect.metadata("AltValueDestinations", ["dataSourceNameForClient", "dataSourceNameForServer"]),
    Reflect.metadata("ValueRange", Object.keys(TIProcessDataSourceType))
], TIProcessDataSource.prototype, "Type", void 0);
__decorate([
    Reflect.metadata("Placeholder", "<Datasource_Name>")
], TIProcessDataSource.prototype, "dataSourceNameForClient", void 0);
__decorate([
    Reflect.metadata("Alias", "Query")
], TIProcessDataSource.prototype, "query", void 0);
__decorate([
    Reflect.metadata("Alias", "UserName")
], TIProcessDataSource.prototype, "userName", void 0);
__decorate([
    Reflect.metadata("Alias", "Password")
], TIProcessDataSource.prototype, "password", void 0);
__decorate([
    Reflect.metadata("Alias", "Unicode")
], TIProcessDataSource.prototype, "usesUnicode", void 0);
exports.TIProcessDataSource = TIProcessDataSource;
TIProcessDataSource.prototype.Type = TIProcessDataSourceType.None;
TIProcessDataSource.prototype.asciiDecimalSeparator = ".";
TIProcessDataSource.prototype.asciiDelimiterChar = ",";
TIProcessDataSource.prototype.asciiDelimiterType = "Character";
TIProcessDataSource.prototype.asciiHeaderRecords = 0;
TIProcessDataSource.prototype.asciiQuoteCharacter = "\"";
TIProcessDataSource.prototype.asciiThousandSeparator = ",";
TIProcessDataSource.prototype.dataSourceNameForClient = "";
TIProcessDataSource.prototype.dataSourceNameForServer = "";
TIProcessDataSource.prototype.view = "";
TIProcessDataSource.prototype.subset = "";
TIProcessDataSource.prototype.query = "";
TIProcessDataSource.prototype.userName = "";
TIProcessDataSource.prototype.password = "";
TIProcessDataSource.prototype.usesUnicode = true;
class TIProcessDefn {
}
__decorate([
    Reflect.metadata("Comment", true)
], TIProcessDefn.prototype, "Description", void 0);
__decorate([
    Reflect.metadata("DisplaySize", markdown_1.DisplaySize.Large),
    Reflect.metadata("Alias", "Process")
], TIProcessDefn.prototype, "Name", void 0);
__decorate([
    Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n"),
    Reflect.metadata("Alias", "Prolog")
], TIProcessDefn.prototype, "PrologProcedure", void 0);
__decorate([
    Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n"),
    Reflect.metadata("Alias", "MetaData")
], TIProcessDefn.prototype, "MetadataProcedure", void 0);
__decorate([
    Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n"),
    Reflect.metadata("Alias", "Data")
], TIProcessDefn.prototype, "DataProcedure", void 0);
__decorate([
    Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n"),
    Reflect.metadata("Alias", "Epilog")
], TIProcessDefn.prototype, "EpilogProcedure", void 0);
__decorate([
    Reflect.metadata("Description", "Process parameters. Each parameter is specified in the following form:" +
        " <Parameter_Type>: <Parameter_Name>,<Default_Value>,<Parameter_Prompt>"),
    Reflect.metadata("ElementType", TIProcessParameter.prototype)
], TIProcessDefn.prototype, "Parameters", void 0);
__decorate([
    Reflect.metadata("Description", "Process variables. Each variable is specified in the following form:" +
        " <Variable_Type>: <Variable_Name>,<Variable_Position>"),
    Reflect.metadata("ElementType", TIProcessVariable.prototype)
], TIProcessDefn.prototype, "Variables", void 0);
exports.TIProcessDefn = TIProcessDefn;
TIProcessDefn.prototype.Description = "This is an auto-generated template for creating a new TI process." +
    "\r\Values enclosed in the <> are just placeholders, for example <Datasource_Name>." +
    " Replace those with actual values or just leave unmodified if no values need to be specified.\r\n\r\n";
TIProcessDefn.prototype.Name = "";
TIProcessDefn.prototype.HasSecurityAccess = false;
TIProcessDefn.prototype.PrologProcedure = "";
TIProcessDefn.prototype.MetadataProcedure = "";
TIProcessDefn.prototype.DataProcedure = "";
TIProcessDefn.prototype.EpilogProcedure = "";
TIProcessDefn.prototype.Parameters = [];
TIProcessDefn.prototype.Variables = [];
TIProcessDefn.prototype.DataSource = TIProcessDataSource.prototype;
//# sourceMappingURL=process.js.map