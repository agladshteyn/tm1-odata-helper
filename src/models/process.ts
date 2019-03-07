
import { DisplaySize } from '../markdown'

export enum TIProcessDataSourceType { None = "None", ODBC = "ODBC", ASCII = "ASCII", TM1CubeView = "TM1CubeView", TM1DimensionSubset = "TM1DimensionSubset" };

export class TIProcessVariable {
    Name: string;
    @Reflect.metadata("ValueRange", ["Numeric", "String"])
    Type: string;
    Position: number;
    StartByte: 0;
    EndByte: 0;
}

TIProcessVariable.prototype.Name = "";
TIProcessVariable.prototype.Type = "";
TIProcessVariable.prototype.Position = 0;
TIProcessVariable.prototype.StartByte = 0;
TIProcessVariable.prototype.EndByte = 0;

export class TIProcessParameter {
    @Reflect.metadata("Position", 0)
    Name: string;
    @Reflect.metadata("Placeholder", "<Prompt>")
    @Reflect.metadata("Position", 2)
    Prompt: string;
    @Reflect.metadata("ValueRange", ["Numeric", "String"])
    Type: string;
    @Reflect.metadata("Placeholder", "<Default_Value>")
    @Reflect.metadata("Position", 1)
    Value: any;
}

TIProcessParameter.prototype.Name = "";
TIProcessParameter.prototype.Prompt = "";
TIProcessParameter.prototype.Type = "";
TIProcessParameter.prototype.Value = 0;

export class TIProcessDataSource {
    @Reflect.metadata("Description", "Process datasource section. Value specified for the <Datasource_Name> placeholder" +
    " will be used to set the \"dataSourceNameForClient\" and \"dataSourceNameForServer\" fields.")
    @Reflect.metadata("AltValueDestinations", ["dataSourceNameForClient", "dataSourceNameForServer"])
    @Reflect.metadata("ValueRange", Object.keys(TIProcessDataSourceType))
    Type: string; // None, ASCII, ODBC, TM1CubeView, TM1DimensionSubset
    asciiDecimalSeparator: string;
    asciiDelimiterChar: string;
    asciiDelimiterType: string;
    asciiHeaderRecords: number;
    asciiQuoteCharacter: string;
    asciiThousandSeparator: string;
    
    @Reflect.metadata("Placeholder", "<Datasource_Name>")
    dataSourceNameForClient: string;
    dataSourceNameForServer: string;
    view: string;
    subset: string;
    @Reflect.metadata("Alias", "Query")
    query: string;
    @Reflect.metadata("Alias", "UserName")
    userName: string;
    @Reflect.metadata("Alias", "Password")
    password: string;
    @Reflect.metadata("Alias", "Unicode")
    usesUnicode: boolean;
}

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

export class TIProcessDefn {
    @Reflect.metadata("Comment", true)
    Description: string;

    @Reflect.metadata("DisplaySize", DisplaySize.Large)
    @Reflect.metadata("Alias", "Process")
    Name: string;
    HasSecurityAccess: boolean;

    @Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n")
    @Reflect.metadata("Alias", "Prolog")
    PrologProcedure: string;
    @Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n")
    @Reflect.metadata("Alias", "MetaData")
    MetadataProcedure: string;
    @Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n")
    @Reflect.metadata("Alias", "Data")
    DataProcedure: string;
    @Reflect.metadata("Placeholder", "\r\n    #****Begin: Generated Statements***\r\n    #****End: Generated Statements****\r\n")
    @Reflect.metadata("Alias", "Epilog")
    EpilogProcedure: string;
    DataSource: TIProcessDataSource;
    @Reflect.metadata("Description", "Process parameters. Each parameter is specified in the following form:" +
    " <Parameter_Type>: <Parameter_Name>,<Default_Value>,<Parameter_Prompt>")
    @Reflect.metadata("ElementType", TIProcessParameter.prototype)
    Parameters: TIProcessParameter[];
    @Reflect.metadata("Description", "Process variables. Each variable is specified in the following form:" +
    " <Variable_Type>: <Variable_Name>,<Variable_Position>")
    @Reflect.metadata("ElementType", TIProcessVariable.prototype)
    Variables: TIProcessVariable[];
}

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