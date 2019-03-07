'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("util");
const request = require('request');
const url = require('url');
class TM1Client {
    constructor() {
        this.databases = [];
        this.connections = [];
    }
    setProxy(proxy) {
        this.proxy = proxy;
    }
    // Updates the request options to supply the values necessary for TM1 authorization.
    // If we have a "TM1SessionId" cookie for the specified connection, it will pass that.
    // Otherwise, it will create the "Authorization" header with credentials.
    setAuthorization(connection, requestOptions) {
        requestOptions.jar = true;
        const newJar = request.jar();
        if (connection.hasSession() === false) { // If no session cookie
            let connString = connection.Username + ':' + connection.Password;
            if (connection.ConnectionType === 'CAM')
                connString += ':' + connection.CAMNamespace;
            let buff = new Buffer(connString);
            if (!requestOptions.headers)
                requestOptions.headers = {};
            requestOptions.headers['Authorization'] = connection.ConnectionType + ' ' + buff.toString('base64');
        }
        else { // If session cookie is present
            newJar.setCookie(request.cookie(`TM1SessionId=${connection.TM1SessionCookie}`), requestOptions.url);
        }
        requestOptions.jar = newJar;
    }
    test(endpoint, procDefn, connection) {
        this.post(endpoint, JSON.stringify(procDefn), connection);
    }
    post(endpoint, body, connection) {
        var options = {
            url: connection.Url + endpoint,
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            strictSSL: false,
            body: body,
            proxy: this.proxy
        };
        this.setAuthorization(connection, options);
        request.post(options, (error, res, body) => {
            var errorMsg;
            if (error && error.message && error.message !== "")
                errorMsg = error.message;
            else {
                if (!res || res.statusCode !== 201) {
                    errorMsg = `Error while running the request.`;
                    if (res)
                        errorMsg += ` Status code ${res.statusCode}.`;
                    if (body && body !== "")
                        errorMsg += `\nDetails:\n ${body}`;
                }
            }
            if (errorMsg)
                vscode.window.showErrorMessage(errorMsg);
            else
                vscode.window.showInformationMessage(`Request completed successfully!`);
            // If this is not a saved connection where the user specified it on demand, logout after the request is finished.
            if (connection.hasName() === false)
                this.logout(connection);
        });
    }
    checkTM1Version(connection, callback) {
        // First, we will try the "Configuration" endpoint, which is used on in versions before Planning Analytics.
        var options = {
            url: connection.Url + '/api/v1/Configuration',
            json: true,
            strictSSL: false,
            proxy: this.proxy
        };
        this.setAuthorization(connection, options);
        request.get(options, (error, res, body) => {
            if (res.statusCode === 404) { // If "Configuration" endpoint not found, try the "Server" endpoint, which is used in Planning Analytics
                options.url = connection.Url + '/api/v1/Server';
                request.get(options, (error, res, body) => {
                    let errorMsg = this.getResponseError(error, res, body, options);
                    if (!errorMsg) {
                        if (res.statusCode === 200)
                            connection.isPlanningAnalytics = true;
                        callback(options);
                    }
                    else
                        vscode.window.showErrorMessage(errorMsg);
                });
            }
            else {
                connection.isPlanningAnalytics = false;
                callback(options);
            }
        });
    }
    addConnection(connection) {
        var callback = (options) => {
            this.connections.push(connection);
            this.setSessionCookie(connection, options);
            vscode.window.showInformationMessage(`Connection saved successfully!`);
        };
        this.checkTM1Version(connection, callback);
    }
    // TODO: centralize this method
    getResponseError(error, response, body, connectionOpts) {
        var errorMsg;
        if (error && error.message && error.message !== "")
            errorMsg = error.message;
        else {
            if (!response || (response.statusCode !== 201 && response.statusCode !== 200)) {
                errorMsg = `Error while running the request. Url: ${connectionOpts.url}.`;
                if (response)
                    errorMsg += ` Status code ${response.statusCode}.`;
                if (body && body !== "")
                    errorMsg += `\nDetails:\n ${body}`;
            }
        }
        return errorMsg;
    }
    processResponse(error, response, connectionOpts, connection) {
        if (!error && response.statusCode == 200) {
            this.connections.push(connection);
            this.setSessionCookie(connection, connectionOpts);
            vscode.window.showInformationMessage(`Connection saved successfully!`);
        }
        else {
            vscode.window.showErrorMessage(`Error connecting to server ${connectionOpts.url}: status code ${response.statusCode}`);
        }
    }
    // Extract "TM1SessionId" cookie and store it in the supplied connection instance.
    setSessionCookie(connection, connectionOpts) {
        if (connectionOpts.jar) {
            for (const cookie of connectionOpts.jar.getCookies(connectionOpts.url)) {
                if (cookie.key === "TM1SessionId") {
                    connection.TM1SessionCookie = cookie.value;
                    break;
                }
            }
        }
    }
    logout(connection) {
        // We only want to execute the "logout" request if we have a "TM1SessionId" cookie returned from previous requests.
        if (!connection.TM1SessionCookie || connection.TM1SessionCookie === "")
            return;
        var options = {
            url: connection.Url + '/api/logout',
            json: true,
            strictSSL: false,
            proxy: this.proxy
        };
        this.setAuthorization(connection, options);
        request.get(options, (error, res, body) => {
            connection.TM1SessionCookie = "";
            //if (!error && res.statusCode == 200) {
            //    vscode.window.showInformationMessage(`Loggout successful!`);
            // } else {
            //   vscode.window.showErrorMessage(`Error logging out of ${connection.Name}. Status code: ${res.statusCode}`);
            //}
        });
    }
    initServers(body) {
        this.databases = [];
        for (let db of body.value) {
            let dataBase = new TM1DataBase;
            dataBase.Name = db.Name;
            dataBase.IPAddress = db.IPAddress;
            dataBase.IPv6Address = db.IPv6Address;
            dataBase.PortNumber = db.PortNumber;
            dataBase.ClientMessagePortNumber = db.ClientMessagePortNumber;
            dataBase.HTTPPortNumber = db.HTTPPortNumber;
            dataBase.UsingSSL = db.UsingSSL;
            dataBase.AcceptingClients = db.AcceptingClients;
            if (dataBase.AcceptingClients) {
                this.databases.push(dataBase);
            }
        }
    }
    getConnectionByName(name) {
        let c;
        this.connections.forEach((conn) => {
            if (conn.Name === name) {
                c = conn;
                return;
            }
        });
        return c;
    }
    getConnectionNames() {
        let connNames = [];
        this.connections.forEach((conn) => {
            connNames.push(conn.Name);
        });
        return connNames;
    }
    getDatabaseNames() {
        let databaseNames = [];
        this.databases.forEach((db) => {
            databaseNames.push(db.Name);
        });
        return databaseNames;
    }
    login(database, user, passwd) {
        this.database = this.databases.find((db) => {
            return db.Name == database;
        });
        this.user = user;
        this.passwd = passwd;
    }
    getLogin() {
        if (!this.database) {
            return null;
        }
        let login = new TM1DataBaseLogin();
        if (this.database.UsingSSL) {
            login.Protocol = 'https:';
        }
        else {
            login.Protocol = 'http:';
        }
        login.Host = this.database.IPAddress;
        login.Port = this.database.HTTPPortNumber;
        login.User = this.user;
        login.Passwd = this.passwd;
        return login;
    }
}
exports.TM1Client = TM1Client;
class TM1DataBaseLogin {
}
exports.TM1DataBaseLogin = TM1DataBaseLogin;
class TM1DataBase {
}
class TM1Connection {
    hasSession() {
        return util_1.isNullOrUndefined(this.TM1SessionCookie) === false && this.TM1SessionCookie !== "";
    }
    hasName() {
        return util_1.isNullOrUndefined(this.Name) === false && this.Name !== "";
    }
}
exports.TM1Connection = TM1Connection;
//# sourceMappingURL=tm1client.js.map