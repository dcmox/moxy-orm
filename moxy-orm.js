"use strict";
/**
 * Created by Daniel Moxon
 * GitHub: https://github.com/dcmox/moxy-orm
 * **/
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var fs = require('fs');
var _f = require('underscore-functions')._f;
var REGEX_INTERFACE = /interface ([^{]+)? {([^}]+)}/g;
var REGEX_SQL_TABLES = /CREATE TABLE (?:`|')?([a-zA-Z0-9_-]+)(?:`|')? \(([^;]*)\)(.*);?/g;
var REGEX_SQL_FIELDS = /(?:`|')?(?: *)([a-zA-Z0-9_-]*)(?:`|')? ([a-zA-Z0-9_-]+)(\(.*\))? ?([a-zA-Z0-9_\- +'"`.(,)]*)?,?/g;
var MOXY_HEADER = "/*\tClass generation courtesy of MoxyORM\n*\thttps://github.com/dcmox/moxy-orm\n***/\n\n";
exports.pascalCase = function (s) { return s.replace(/_/g, ' ').split(' ').map(function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }).join(''); };
exports.camelCase = function (s) { return s.replace(/_/g, ' ').split(' ').map(function (s, i) { return i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1); }).join(''); };
exports.currentDirectory = function () { return __dirname.indexOf('/') > -1 ? __dirname.split('/').pop() || '' : __dirname.split('\\').pop() || ''; };
exports.absolutePath = function () { return __dirname.replace(/\\/g, '/'); };
exports.parentDir = function (path) {
    if (~path.indexOf('/')) {
        var tmp = path.split('/');
        tmp.pop();
        return tmp.join('/');
    }
    return path;
};
exports.addBreak = function (line, numberOfBreaks) {
    if (numberOfBreaks === void 0) { numberOfBreaks = 2; }
    return line + new Array(numberOfBreaks).fill('\n').join('');
};
exports.addLine = function (line, tabs, useSpaces) {
    if (tabs === void 0) { tabs = 0; }
    if (useSpaces === void 0) { useSpaces = 0; }
    return useSpaces
        ? new Array(useSpaces * tabs).fill(' ').join('') + line + '\n'
        : new Array(tabs).fill('\t').join('') + line + '\n';
};
// from any path, eg, an interface file. create an output class that can reference the src.
exports.importPathToSrc = function (src, dest) {
    if (src.startsWith('/') || ~src.indexOf(':')) {
        return src;
    }
    // Paths must be consistent
    if (src.endsWith('/')) {
        src = src.slice(0, src.length - 1);
    }
    if (dest.endsWith('/')) {
        dest = dest.slice(0, dest.length - 1);
    }
    // Force src to be whole path
    var diffDrive = false;
    if (dest.startsWith('/') || dest.startsWith('\\') || ~dest.indexOf(':')) {
        var path = exports.absolutePath();
        if (~path.indexOf(':') && dest.indexOf(':') === -1) {
            dest = path.split(':')[0] + ':' + dest;
        }
        else if (~path.indexOf(':') && ~dest.indexOf(':')) {
            diffDrive = true;
        }
        if (src.startsWith('./')) {
            src = path + src.slice(1);
        }
        else if (src.startsWith('..')) {
            var nodes = src.split('/');
            path = path.split('/');
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i] === '..') {
                    nodes.shift();
                    path.pop();
                }
                else {
                    break;
                }
            }
            src = path.join('/') + '/' + nodes.join('/');
        }
        else {
            src = path + src;
        }
    }
    if (diffDrive) {
        return src;
    }
    if (!src.startsWith('.') && !src.startsWith('/') && !~src.indexOf(':')) {
        src = './' + src;
    }
    if (!dest.startsWith('.') && !dest.startsWith('/') && !dest.startsWith('\\') && !~dest.indexOf(':')) {
        dest = './' + dest;
    }
    // Split paths into nodes
    var srcNodes = src.split('/');
    var destNodes = dest.split('/');
    var srcRoot = srcNodes[0];
    var destRoot = destNodes[0];
    var pathNodes = [];
    // More normalization of root
    if (srcRoot === '.' && destRoot !== '.') {
        var cdir = exports.currentDirectory();
        if (!cdir) {
            return '';
        }
        srcNodes = __spreadArrays([srcRoot, cdir], srcNodes.slice(1));
        srcRoot = '..';
    }
    else if (destRoot === '.' && srcRoot !== '.') {
        var cdir = exports.currentDirectory();
        if (!cdir) {
            return '';
        }
        destNodes = __spreadArrays([destRoot, cdir], destNodes.slice(1));
        destRoot = '..';
    }
    if (srcRoot === destRoot) {
        if (destNodes.length >= srcNodes.length) {
            var i = 1;
            for (; i < srcNodes.length; i++) {
                if (srcNodes[i] != destNodes[i]) {
                    break;
                }
            }
            pathNodes = __spreadArrays(new Array(destNodes.length - i).fill('..'));
            for (; i < srcNodes.length; i++) {
                pathNodes.push(srcNodes[i]);
            }
        }
        else {
            if (~destRoot.indexOf(':')) {
                return '/' + srcNodes.slice(1).join('/');
            }
            var i = 1;
            for (; i < destNodes.length; i++) {
                if (destNodes[i] != srcNodes[i]) {
                    break;
                }
            }
            pathNodes = __spreadArrays(new Array(destNodes.length - i).fill('..'));
            for (; i < srcNodes.length; i++) {
                pathNodes.push(srcNodes[i]);
            }
        }
    }
    return pathNodes.join('/');
};
exports.interfacesToClass = function (src, dest, lib) {
    if (dest === undefined) {
        dest = src + "/gen";
    }
    if (lib === undefined) {
        lib = "" + src;
    }
    var interfaces = fs.readdirSync(src);
    interfaces.forEach(function (f) {
        var fp = src + "/" + f;
        var contents = exports.fileToClass(fp, dest || '', lib || '');
        contents.forEach(function (content) {
            fs.writeFileSync(dest + "/" + content.dest, content.data);
        });
    });
    return true;
};
exports.getTypeFromValue = function (value) {
    var type = 'any';
    if (Array.isArray(value)) {
        type = 'any[]';
        if (value.length === 1) {
            if (typeof value[0] === 'object') {
                type = exports.getTypeFromValue(value[0]) + '[][]';
            }
            else {
                type = typeof value[0] + '[]';
            }
        }
        else if (value.length > 1) {
            type = typeof value[0];
            if (type === 'object') {
                type = exports.getTypeFromValue(value[0]) + '[]';
            }
            else {
                for (var i = 1; i < value.length; i++) {
                    if (typeof value[i] !== type) {
                        type = 'any[]';
                        break;
                    }
                }
            }
            if (type.indexOf('[]') === -1) {
                type += '[]';
            }
        }
    }
    else {
        type = toString.call(value).replace('[object ', '').replace(']', '');
        if (type === 'Object') {
            type = 'any';
        }
    }
    return type;
};
// If multiple documents, populate as many fields as possible
exports.interfaceFromDocument = function (collectionName, docs) {
    var docInterface = exports.addLine("interface " + collectionName + " {");
    var document = {};
    docs.forEach(function (doc) { document = Object.assign(document, doc); });
    Object.keys(document).forEach(function (key) {
        var type = typeof document[key];
        if (type === 'object') {
            type = exports.getTypeFromValue(document[key]);
        }
        docInterface += exports.addLine(key + ": " + type + ",", 1);
    });
    docInterface += "}";
    return docInterface;
};
exports.documentToClass = function (collectionName, docs, outputDir, lib) {
    var interfaceFromDoc = exports.interfaceFromDocument('I' + collectionName, docs);
    lib = exports.importPathToSrc(lib || '', outputDir);
    var data = exports.contentsToClass(interfaceFromDoc, interfaceFromDoc, lib || '', 'I');
    if (data[0]) {
        fs.writeFileSync(outputDir + "/" + collectionName + ".ts", data[0].data);
        return true;
    }
    return false;
};
exports.fileToClass = function (path, interfaceOrDestination, lib, prefix) {
    if (prefix === void 0) { prefix = 'I'; }
    var contents = fs.readFileSync(path).toString();
    if (interfaceOrDestination.indexOf('{') === -1) {
        lib = exports.importPathToSrc(lib, interfaceOrDestination);
        interfaceOrDestination = exports.importPathToSrc(path.replace(/.ts|.js/, ''), interfaceOrDestination);
    }
    return exports.contentsToClass(contents, interfaceOrDestination, lib, prefix);
};
exports.contentsToClass = function (contents, interfaceOrDestination, lib, prefix) {
    if (prefix === void 0) { prefix = ''; }
    var r = new RegExp(REGEX_INTERFACE);
    var cls;
    var output = [];
    while ((cls = r.exec(contents))) {
        var className = cls[1], props = cls[2];
        if (prefix && className[0] === prefix) {
            className = className.slice(1);
        }
        var out = exports.generateClass(className, props, interfaceOrDestination, lib, cls[1]);
        output.push(out);
    }
    return output;
};
/* Allow path to be defined to export */
exports.generateClass = function (className, props, interfaceOrDestination, lib, iClassName) {
    if (!iClassName) {
        iClassName = className;
    }
    var out;
    var libImport = '';
    if (lib) {
        libImport = exports.addLine("import { DBModel } from '" + lib + "/DBModel'");
    }
    if (interfaceOrDestination && ~interfaceOrDestination.indexOf('{')) {
        out = { dest: className + '.ts', data: MOXY_HEADER + libImport + ("\n" + interfaceOrDestination + "\n\n") };
    }
    else {
        out = interfaceOrDestination
            ? { dest: className + '.ts', data: MOXY_HEADER + libImport + exports.addBreak("import { " + iClassName + " } from '" + interfaceOrDestination + "'") }
            : { dest: className + '.ts', data: MOXY_HEADER + libImport };
    }
    // Extends DBModel 
    out.data += "export class " + className + " extends DBModel {\n";
    var getters = '';
    var setters = '';
    var construct = '';
    var propInitializer = '';
    var defaultMap = {
        string: "''",
        number: "0",
        boolean: "false",
        date: "new Date()",
        array: "[]"
    };
    out.data += exports.addLine("private props: " + iClassName, 1);
    props.split(',').forEach(function (prop) {
        if (!prop.trim()) {
            return;
        }
        var _a = prop.replace(/\t|\n/g, '').trim().split(':').map(function (v) { return v.trim(); }), key = _a[0], type = _a[1];
        var typeKey = type.toLowerCase();
        if (typeKey.indexOf('[]') !== -1) {
            typeKey = 'array';
        }
        var isOptional = key.indexOf('?') > -1;
        var orUndefined = '';
        if (isOptional) {
            key = key.substring(0, key.length - 1);
            orUndefined = ' | undefined';
        }
        // enum
        if (typeKey.startsWith('E')) {
            typeKey = 'number';
        }
        var properKey = exports.pascalCase(key);
        propInitializer += exports.addLine(key + ": " + defaultMap[typeKey] + ",", 4);
        getters += exports.addLine("public get" + properKey + "(): " + type + orUndefined + " {", 1);
        getters += exports.addLine("return this.props." + key, 2);
        getters += exports.addLine("}", 1);
        setters += exports.addLine("public set" + properKey + "(value: " + type + "): " + className + " {", 1);
        setters += exports.addLine("this.props." + key + " = value", 2);
        setters += exports.addLine("return this", 2);
        setters += exports.addLine("}", 1);
    });
    construct = exports.addLine("public constructor(fields?: " + iClassName + ") {", 1);
    construct += exports.addLine("super(fields)", 2);
    construct += exports.addLine("if (fields) {", 2);
    construct += exports.addLine("this.props = fields", 3);
    construct += exports.addLine("} else {", 2);
    construct += exports.addLine("this.props = {", 3);
    construct += propInitializer;
    construct += exports.addLine("}", 3);
    construct += exports.addLine("}", 2);
    construct += exports.addLine("return this", 2);
    construct += exports.addLine("}", 1);
    out.data += construct;
    out.data += getters;
    out.data += setters;
    out.data += exports.addBreak("}");
    return out;
};
exports.SqlTypeMap = {
    'string': ['varbinary', 'binary', 'time', 'char', 'varchar', 'tinytext', 'longtext', 'text'],
    'number': ['decimal', 'numeric', 'float', 'double', 'precision', 'tinyint', 'int', 'smallint', 'mediumint', 'year'],
    'date': ['timestamp', 'datetime', 'date'],
    'blob': ['blob', 'tinyblob', 'mediumblob', 'longblob'],
    'bigint': 'BigInt',
    'boolean': 'boolean'
};
exports.valuesFromSetOrEnum = function (cond) {
    cond = cond.replace(/\(|\)|'/g, '');
    if (cond.indexOf(',') === -1) {
        return [cond];
    }
    return cond.split(',');
};
exports.getTypeFromSqlType = function (field, type, cond) {
    if (exports.SqlTypeMap.string.includes(type)) {
        return 'string';
    }
    if (exports.SqlTypeMap.number.includes(type)) {
        return 'number';
    }
    if (exports.SqlTypeMap.date.includes(type)) {
        return 'Date';
    }
    if (exports.SqlTypeMap.blob.includes(type)) {
        return 'Blob';
    }
    if (type === 'set') {
        var values = exports.valuesFromSetOrEnum(cond);
        if (values.length === 1) {
            return "Set<" + exports.getTypeFromValue(values[0]) + ">";
        }
        var type_1 = exports.getTypeFromValue(values[0]);
        for (var i = 1; i < values.length; i++)
            if (exports.getTypeFromValue(values[i]) !== type_1) {
                return 'Set<any>';
            }
        return "Set<" + type_1 + ">";
    }
    if (type === 'enum') {
        return 'E' + exports.pascalCase(field);
    }
    if (exports.SqlTypeMap[type]) {
        return exports.SqlTypeMap[type];
    }
    return 'any';
};
exports.interfaceFromTable = function (tableName, fields) {
    var typeDeclarations = '';
    var docInterface = exports.addLine("interface I" + exports.pascalCase(tableName) + " {");
    var r = new RegExp(REGEX_SQL_FIELDS);
    var match;
    while ((match = r.exec(fields))) {
        var field = match[1], sqlType = match[2], cond = match[3], opts = match[4];
        var type = exports.getTypeFromSqlType(field, sqlType.toLowerCase(), cond);
        if (sqlType === 'enum') {
            typeDeclarations += exports.addLine("enum " + type + " {");
            var values = exports.valuesFromSetOrEnum(cond);
            values.forEach(function (value) { return typeDeclarations += exports.addLine(value + ',', 1); });
            typeDeclarations += exports.addBreak('}');
        }
        if (field && !['PRIMARY', 'UNIQUE', 'KEY'].includes(field)) {
            docInterface += exports.addLine(field + ": " + type + ",", 1);
        }
    }
    docInterface += exports.addLine('}');
    return typeDeclarations + docInterface;
};
exports.sqlSchemaToClasses = function (schema, dest, lib) {
    var sql = fs.readFileSync(schema).toString().replace(/create table/gi, 'CREATE TABLE');
    var re = new RegExp(REGEX_SQL_TABLES);
    var match;
    while ((match = re.exec(sql))) {
        var tableName = match[1], fields = match[2];
        var interfaceFromTbl = exports.interfaceFromTable(tableName, fields);
        var data = exports.contentsToClass(interfaceFromTbl, interfaceFromTbl, lib || '', 'I');
        data.forEach(function (out) { return fs.writeFileSync(dest + "/" + out.dest, out.data); });
    }
    return true;
};
var formTypeMap = {
    password: 'password',
    radio: 'radio'
};
exports.documentToHtml = function (doc, formId, indentLevel, group) {
    if (indentLevel === void 0) { indentLevel = 0; }
    var html = '';
    if (formId) {
        html += exports.addLine("<form id=\"" + formId + "\">");
    }
    var keys = Object.keys(doc);
    keys.forEach(function (key) {
        if (toString.call(doc[key]) === "[object Object]") {
            html += exports.addLine("<fieldset>", 1 + indentLevel);
            html += exports.addLine("<legend>" + key + "</legend>", 2 + indentLevel);
            html += exports.addLine("<p>", 2 + indentLevel);
            html += exports.documentToHtml(doc[key], undefined, 2 + indentLevel, key);
            html += exports.addLine("</p>", 2 + indentLevel);
            html += exports.addLine("</fieldset>", 1 + indentLevel);
        }
        else {
            var type = formTypeMap[key]
                ? formTypeMap[key]
                : formTypeMap[doc[key]]
                    ? formTypeMap[doc[key]]
                    : exports.getTypeFromValue(doc[key]).toLowerCase();
            if (type === 'radio') {
                html += exports.addLine("<label for=\"" + key + "\">" + _f.keyToField(key) + "</label><input type=\"radio\" name=\"" + group + "[]\" value=\"\" class=\"input-" + type + "\" />", 2 + indentLevel);
            }
            else {
                html += exports.addLine("<p>", 1 + indentLevel);
                html += exports.addLine("<label for=\"" + key + "\">" + _f.keyToField(key) + "</label><input name=\"" + key + "\" type=\"text\" value=\"\" class=\"input-" + type + "\" />", 2 + indentLevel);
                html += exports.addLine("</p>", 1 + indentLevel);
            }
        }
    });
    if (formId) {
        html += exports.addLine("</form>");
    }
    return html;
};
var MoxyORM = /** @class */ (function () {
    function MoxyORM() {
    }
    MoxyORM.interfacesToClass = exports.interfacesToClass;
    MoxyORM.interfaceFromDocument = exports.interfaceFromDocument;
    MoxyORM.documentToClass = exports.documentToClass;
    MoxyORM.importPathToSrc = exports.importPathToSrc;
    MoxyORM.parentDir = exports.parentDir;
    MoxyORM.sqlSchemaToClasses = exports.sqlSchemaToClasses;
    MoxyORM.documentToHtml = exports.documentToHtml;
    return MoxyORM;
}());
exports.MoxyORM = MoxyORM;
exports["default"] = MoxyORM;
