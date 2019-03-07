'use strict';

import * as vscode from 'vscode';
import { isUndefined, isNullOrUndefined } from 'util';
import { TIProcessDefn } from './models/process';
import { TIProcess } from './tiprocess';

const request = require('request');
const url = require('url');
type CheckVersionCallback = (connectionOpts: any) => any;

export class TM1Client {

    private connections: TM1Connection[];
    private databases: TM1DataBase[];
    private database: TM1DataBase;
    private user: string;
    private passwd: string;
    private proxy: string;

    constructor() {
        this.databases = [];
        this.connections = [];
    }

    public setProxy(proxy: string) {
        this.proxy = proxy;
    }

    // Updates the request options to supply the values necessary for TM1 authorization.
    // If we have a "TM1SessionId" cookie for the specified connection, it will pass that.
    // Otherwise, it will create the "Authorization" header with credentials.
    private setAuthorization(connection: TM1Connection, requestOptions: any) {
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
        } else { // If session cookie is present
            newJar.setCookie(request.cookie(`TM1SessionId=${connection.TM1SessionCookie}`), requestOptions.url);
        }

        requestOptions.jar = newJar;
    }

    public test(endpoint: string, procDefn: TIProcessDefn, connection: TM1Connection ) {
        this.post(endpoint, JSON.stringify(procDefn), connection);
    }

    public post(endpoint: string, body: string, connection: TM1Connection) {
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
                        errorMsg += ` Status code ${res.statusCode}.`

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

    public checkTM1Version(connection: TM1Connection, callback: CheckVersionCallback) {
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
            } else {
                connection.isPlanningAnalytics = false;
                callback(options);
            }
        });
    }

    public addConnection(connection: TM1Connection) {
        var callback = (options) => {
            this.connections.push(connection);
            this.setSessionCookie(connection, options);
            vscode.window.showInformationMessage(`Connection saved successfully!`);
        }

        this.checkTM1Version(connection, callback);
    }

    // TODO: centralize this method
    private getResponseError(error: any, response: any, body: any, connectionOpts: any): string {
        var errorMsg;
        if (error && error.message && error.message !== "")
            errorMsg = error.message;
        else {
            if (!response || (response.statusCode !== 201 && response.statusCode !== 200)) {
                errorMsg = `Error while running the request. Url: ${connectionOpts.url}.`;
                if (response)
                    errorMsg += ` Status code ${response.statusCode}.`

                if (body && body !== "")
                    errorMsg += `\nDetails:\n ${body}`;
            }
        }

        return errorMsg;
    }

    private processResponse(error: any, response: any, connectionOpts: any, connection: TM1Connection) {
        if (!error && response.statusCode == 200) {
            this.connections.push(connection);
            this.setSessionCookie(connection, connectionOpts);
            vscode.window.showInformationMessage(`Connection saved successfully!`);
         } else {
             vscode.window.showErrorMessage(`Error connecting to server ${connectionOpts.url}: status code ${response.statusCode}`);
         }
    }

    // Extract "TM1SessionId" cookie and store it in the supplied connection instance.
    private setSessionCookie(connection: TM1Connection, connectionOpts: any) {
        if (connectionOpts.jar) {
            for (const cookie of connectionOpts.jar.getCookies(connectionOpts.url)) {
                if (cookie.key === "TM1SessionId") {
                    connection.TM1SessionCookie = cookie.value;
                    break;
                }
            }
        }
    }

    public logout(connection: TM1Connection) {
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

    private initServers(body: any) {
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

    public getConnectionByName(name: string): TM1Connection {
        let c: TM1Connection
        this.connections.forEach((conn) => {
            if (conn.Name === name) {
                c = conn;
                return;
            }
        })

        return c;
    }

    public getConnectionNames(): string[] {
        let connNames = [];
        this.connections.forEach((conn) => {
            connNames.push(conn.Name);
        })
        return connNames;
    }

    public getDatabaseNames(): string[] {
        let databaseNames = [];
        this.databases.forEach((db) => {
            databaseNames.push(db.Name);
        })
        return databaseNames;
    }

    public login(database: string, user: string, passwd: string) {
        this.database = this.databases.find((db) => {
            return db.Name == database;
        });
        this.user = user;
        this.passwd = passwd;
    }

    public getLogin(): TM1DataBaseLogin {
        if (!this.database) {
            return null;
        }
        let login = new TM1DataBaseLogin();
        if (this.database.UsingSSL) {
            login.Protocol = 'https:'
        } else {
            login.Protocol = 'http:'
        }
        login.Host = this.database.IPAddress;
        login.Port = this.database.HTTPPortNumber;
        login.User = this.user;
        login.Passwd = this.passwd;
        return login;
    }
}

export class TM1DataBaseLogin {
    Protocol: string;
    Host: string;
    Port: number;
    User: string;
    Passwd: string;
}

class TM1DataBase {
    Name: string;
    IPAddress: string;
    IPv6Address: string;
    PortNumber: number;
    ClientMessagePortNumber: number;
    HTTPPortNumber: number;
    UsingSSL: boolean;
    AcceptingClients: boolean;
}

export class TM1Connection {
    Name: string;
    Url: string;
    Username: string;
    CAMNamespace: string;
    Password: string;
    ConnectionType: string;
    TM1SessionCookie: string;
    isPlanningAnalytics: boolean;
    public hasSession(): boolean {
        return isNullOrUndefined(this.TM1SessionCookie) === false && this.TM1SessionCookie !== "";
    }
    public hasName(): boolean {
        return isNullOrUndefined(this.Name) === false && this.Name !== "";
    }
}
