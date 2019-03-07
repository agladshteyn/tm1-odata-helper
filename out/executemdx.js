"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require('request');
const url = require('url');
class ExecuteMdx {
    executeMDX(mdxcommand, login, callback) {
        var mdx = { MDX: mdxcommand };
        var executeUrl = {
            protocol: login.Protocol,
            slashes: true,
            hostname: login.Host,
            port: login.Port,
            pathname: '/api/v1/ExecuteMDX',
            search: '?$expand=Axes($expand=Hierarchies($expand=Levels($select=Number)),Tuples($expand=Members($select=Name,UniqueName))),' +
                'Cells($select=Value,FormattedValue)'
        };
        var options = {
            url: url.format(executeUrl),
            auth: {
                user: login.User,
                password: login.Passwd
            },
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(JSON.stringify(mdx))
            },
            body: mdx,
            json: true,
            strictSSL: false
        };
        request.post(options, (error, res, body) => {
            if (!error && res.statusCode == 201) {
                callback(this.outputTable(this.tableFromBody(body), this.columnWidthFromBody(body)));
            }
            else {
                console.log('statusCode: ', res.statusCode);
                callback(null, body);
            }
        });
    }
    tableFromBody(body) {
        var table = [];
        var columnCount = body.Axes[0].Tuples.length;
        for (var colHeaderLineIdx = 0; colHeaderLineIdx < body.Axes[0].Hierarchies.length; colHeaderLineIdx++) {
            var line = [];
            for (var rowHeaderColIdx = 0; rowHeaderColIdx < body.Axes[1].Hierarchies.length; rowHeaderColIdx++) {
                line.push('');
            }
            for (var column = 0; column < body.Axes[0].Tuples.length; column++) {
                line.push(body.Axes[0].Tuples[column].Members[colHeaderLineIdx].Name);
            }
            table.push(line);
        }
        for (var row = 0; row < body.Axes[1].Tuples.length; row++) {
            var line = [];
            for (rowHeaderColIdx = 0; rowHeaderColIdx < body.Axes[1].Hierarchies.length; rowHeaderColIdx++) {
                line.push(body.Axes[1].Tuples[row].Members[rowHeaderColIdx].Name);
            }
            for (column = 0; column < columnCount; column++) {
                line.push(body.Cells[row * columnCount + column].FormattedValue);
            }
            table.push(line);
        }
        return table;
    }
    outputTable(table, width) {
        var out = "";
        table.forEach((line, lineIndex, lineArray) => {
            var s = '';
            line.forEach((cell, index, array) => {
                var c = cell + ' '.repeat(width[index]);
                s += c.substr(0, width[index]);
            });
            out += s + "\r\n";
        });
        return out;
    }
    rowElements(body) {
        body.Axes[1].Tuples.forEach((tuple, index, array) => {
            console.log(tuple.Members[0].UniqueName);
        });
    }
    columnWidthFromBody(body) {
        var width = new Array(body.Axes[1].Hierarchies.length + body.Axes[0].Tuples.length);
        width.fill(25, 0, body.Axes[1].Hierarchies.length);
        width.fill(16, body.Axes[1].Hierarchies.length);
        return width;
    }
}
exports.ExecuteMdx = ExecuteMdx;
//# sourceMappingURL=executemdx.js.map