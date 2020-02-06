/** 
 * Created by Daniel Moxon
 * GitHub: https://github.com/dcmox/moxy-orm
 * **/

const fs = require('fs')
const _f = require('underscore-functions')._f

export interface IMongoDocument { [key: string]: any }
export interface IGenerateClassOutput { dest: string, data: string }

const REGEX_INTERFACE = /interface ([^{]+)? {([^}]+)}/g
const REGEX_SQL_TABLES = /CREATE TABLE (?:`|')?([a-zA-Z0-9_-]+)(?:`|')? \(([^;]*)\)(.*);?/g
const REGEX_SQL_FIELDS = /(?:`|')?(?: *)([a-zA-Z0-9_-]*)(?:`|')? ([a-zA-Z0-9_-]+)(\(.*\))? ?([a-zA-Z0-9_\- +'"`.(,)]*)?,?/g
const MOXY_HEADER = `/*\tClass generation courtesy of MoxyORM\n*\thttps://github.com/dcmox/moxy-orm\n***/\n\n`

export const pascalCase = (s: string): string => s.replace(/_/g, ' ').split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
export const camelCase = (s: string): string => s.replace(/_/g, ' ').split(' ').map((s: string, i: number) => i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)).join('')

export const currentDirectory = (): string => __dirname.indexOf('/') > -1 ? __dirname.split('/').pop() || '' : __dirname.split('\\').pop() || ''
export const absolutePath = (): string => __dirname.replace(/\\/g, '/')
export const parentDir = (path: string): string => {
    if (~path.indexOf('/')) {
        let tmp = path.split('/')
        tmp.pop()
        return tmp.join('/')
    }
    return path
}

export const addBreak = (line: string, numberOfBreaks: number = 2) => line + new Array(numberOfBreaks).fill('\n').join('')
export const addLine = (line: string, tabs: number = 0, useSpaces: number = 0) => useSpaces 
    ? new Array(useSpaces * tabs).fill(' ').join('') + line + '\n'
    : new Array(tabs).fill('\t').join('') + line + '\n'

// from any path, eg, an interface file. create an output class that can reference the src.
export const importPathToSrc = (src: string, dest: string): string => {
    if (src.startsWith('/') || ~src.indexOf(':')) { return src }
    // Paths must be consistent
    if (src.endsWith('/')) { src = src.slice(0, src.length - 1) }
    if (dest.endsWith('/')) { dest = dest.slice(0, dest.length - 1) }

    // Force src to be whole path
    let diffDrive: boolean = false
    if (dest.startsWith('/') || dest.startsWith('\\') || ~dest.indexOf(':')) { 
        let path: any = absolutePath()
        if (~path.indexOf(':') && dest.indexOf(':') === -1) { 
            dest = path.split(':')[0] + ':' + dest 
        } else if (~path.indexOf(':') && ~dest.indexOf(':')) {
            diffDrive = true
        }
        
        if (src.startsWith('./')) {
            src = path + src.slice(1)
        } else if (src.startsWith('..')) {
            let nodes = src.split('/')
            path = path.split('/')
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i] === '..') { 
                    nodes.shift()
                    path.pop()
                } 
                else { 
                    break 
                }
            }
            src = path.join('/') + '/' + nodes.join('/')
        } else {
            src = path + src
        }
    }

    if (diffDrive) { return src }

    if (!src.startsWith('.') && !src.startsWith('/') && !~src.indexOf(':')) { src = './' + src }
    if (!dest.startsWith('.') && !dest.startsWith('/') && !dest.startsWith('\\') && !~dest.indexOf(':')) { dest = './' + dest }

    // Split paths into nodes
    let srcNodes = src.split('/')
    let destNodes = dest.split('/')

    let srcRoot: string = srcNodes[0]
    let destRoot: string = destNodes[0]

    let pathNodes: string[] = []

    // More normalization of root
    if (srcRoot === '.' && destRoot !== '.') {
        let cdir: string = currentDirectory()
        if (!cdir) { return '' }
        srcNodes = [srcRoot, cdir, ...srcNodes.slice(1)]
        srcRoot = '..'
    } else if (destRoot === '.' && srcRoot !== '.') {
        let cdir: string = currentDirectory()
        if (!cdir) { return '' }
        destNodes = [destRoot, cdir, ...destNodes.slice(1)]
        destRoot = '..'
    }

    if (srcRoot === destRoot) {
        if (destNodes.length >= srcNodes.length) {
            let i = 1
            for (;i < srcNodes.length; i++) { if (srcNodes[i] != destNodes[i]) { break } }
            pathNodes = [...new Array(destNodes.length - i).fill('..')]
            for (;i < srcNodes.length; i++) { pathNodes.push(srcNodes[i]) }
        } else {
            if (~destRoot.indexOf(':')) { return '/' + srcNodes.slice(1).join('/') }
            let i = 1
            for (;i < destNodes.length; i++) { if (destNodes[i] != srcNodes[i]) { break } }
            pathNodes = [...new Array(destNodes.length - i).fill('..')]
            for (;i < srcNodes.length; i++) { pathNodes.push(srcNodes[i]) }
        }
    }

    return pathNodes.join('/')
}

export const interfacesToClass = (src: string, dest?: string, lib?: string): boolean => {
    if (dest === undefined) { dest = `${src}/gen` }
    if (lib === undefined) { lib = `${src}` }
    let interfaces: any[] = fs.readdirSync(src)
    interfaces.forEach((f: string) => {
        const fp: string = `${src}/${f}`
        const contents: any[] = fileToClass(fp, dest || '', lib || '')
        contents.forEach((content: any) => {
            fs.writeFileSync(`${dest}/${content.dest}`, content.data)
        })
    })
    return true
}

export const getTypeFromValue = (value: any): string => {
    let type: string = 'any'
    if (Array.isArray(value)) {
        type = 'any[]'
        if (value.length === 1) {
            if (typeof value[0] === 'object') {
                type = getTypeFromValue(value[0]) + '[][]'
            } else {
                type = typeof value[0] + '[]'
            }
        } else if (value.length > 1) {
            type = typeof value[0]
            if (type === 'object') { 
                type = getTypeFromValue(value[0]) + '[]'
            } else {
                for (let i = 1; i < value.length; i++) {
                    if (typeof value[i] !== type) {
                        type = 'any[]'
                        break
                    }
                }
            }
            if (type.indexOf('[]') === -1) { type += '[]' }
        }
    } else {
        type = toString.call(value).replace('[object ', '').replace(']', '')
        if (type === 'Object') { type = 'any' }
    }
    return type
}

// If multiple documents, populate as many fields as possible
export const interfaceFromDocument = (collectionName: string, docs: any) => {
    let docInterface: string = addLine(`interface ${collectionName} {`)
    let document: IMongoDocument = {}
    docs.forEach((doc: any) => { document = Object.assign(document, doc) })
    Object.keys(document).forEach((key: string) => {
        let type: string = typeof document[key]
        if (type === 'object') {
            type = getTypeFromValue(document[key])
        }
        docInterface += addLine(`${key}: ${type},`, 1)
    })
    docInterface += `}`
    return docInterface
}

export const documentToClass = (collectionName: string, docs: IMongoDocument[], outputDir: string, lib?: string): boolean => {
    let interfaceFromDoc: string = interfaceFromDocument('I' + collectionName, docs)
    lib = importPathToSrc(lib || '', outputDir)
    let data = contentsToClass(interfaceFromDoc, interfaceFromDoc, lib || '', 'I')
    if (data[0]) {
        fs.writeFileSync(`${outputDir}/${collectionName}.ts`, data[0].data)
        return true
    }
    return false
}

export const fileToClass = (path: string, interfaceOrDestination: string, lib: string, prefix: string = 'I'): IGenerateClassOutput[] => {
    const contents = fs.readFileSync(path).toString()
    if (interfaceOrDestination.indexOf('{') === -1) {
        lib = importPathToSrc(lib, interfaceOrDestination)
        interfaceOrDestination = importPathToSrc(path.replace(/.ts|.js/, ''), interfaceOrDestination)
    }
    return contentsToClass(contents, interfaceOrDestination, lib, prefix)
}

export const contentsToClass = (contents: string, interfaceOrDestination: string, lib: string, prefix: string = ''): IGenerateClassOutput[] => {
    let r: RegExp = new RegExp(REGEX_INTERFACE)
    let cls: any
    let output: any[] = []

    while ((cls = r.exec(contents))) {
        let [, className, props] = cls
        if (prefix && className[0] === prefix) { className = className.slice(1) }

        const out: IGenerateClassOutput = generateClass(className, props, interfaceOrDestination, lib, cls[1])
        output.push(out)
    }

    return output
}

/* Allow path to be defined to export */
export const generateClass = (className: string, props: string, interfaceOrDestination?: string, lib?: string, iClassName?: string): IGenerateClassOutput => {
    if (!iClassName) { iClassName = className }
    let out: IGenerateClassOutput
    let libImport: string = ''
    if (lib) {
        libImport = addLine(`import { DBModel } from '${lib}/DBModel'`)
    }
    if (interfaceOrDestination && ~interfaceOrDestination.indexOf('{')) {
        out = { dest: className + '.ts', data: MOXY_HEADER + libImport + `\n${interfaceOrDestination}\n\n` }
    } else {
        out = interfaceOrDestination
        ? { dest: className + '.ts', data: MOXY_HEADER + libImport + addBreak(`import { ${iClassName} } from '${interfaceOrDestination}'`) }
        : { dest: className + '.ts', data: MOXY_HEADER + libImport }
    }

    // Extends DBModel 
    out.data += `export class ${className} extends DBModel {\n`
    let getters: string = ''
    let setters: string = ''
    let construct: string = ''
    let propInitializer: string = ''
    let defaultMap: any = {
        string: `''`,
        number: `0`,
        boolean: `false`,
        date: `new Date()`,
        array: `[]`,
    }

    out.data += addLine(`private props: ${iClassName}`, 1)
    props.split(',').forEach((prop: string) => {
        if (!prop.trim()) { return }
        let [key, type] = prop.replace(/\t|\n/g, '').trim().split(':').map((v: string) => v.trim())
        let typeKey = type.toLowerCase()
        if (typeKey.indexOf('[]') !== -1) { typeKey = 'array' }
        let isOptional = key.indexOf('?') > -1
        let orUndefined:string = ''
        if (isOptional) { 
            key = key.substring(0, key.length - 1) 
            orUndefined = ' | undefined'
        }
        // enum
        if (typeKey.startsWith('E')) { typeKey = 'number' }
        let properKey = pascalCase(key)
        propInitializer += addLine(`${key}: ${defaultMap[typeKey]},`, 4)
        getters += addLine(`public get${properKey}(): ${type}${orUndefined} {`, 1)
        getters += addLine(`return this.props.${key}`, 2)
        getters += addLine(`}`, 1)
        setters += addLine(`public set${properKey}(value: ${type}): ${className} {`, 1)
        setters += addLine(`this.props.${key} = value`, 2)
        setters += addLine(`return this`, 2)
        setters += addLine(`}`, 1)
    })

    construct = addLine(`public constructor(fields?: ${iClassName}) {`, 1)
    construct += addLine(`super(fields)`, 2)
    construct += addLine(`if (fields) {`, 2)
    construct += addLine(`this.props = fields`, 3)
    construct += addLine(`} else {`, 2)
    construct += addLine(`this.props = {`, 3)
    construct += propInitializer
    construct += addLine(`}`, 3)
    construct += addLine(`}`, 2)
    construct += addLine(`return this`, 2)
    construct += addLine(`}`, 1)

    out.data += construct
    out.data += getters
    out.data += setters
    out.data += addBreak(`}`)
    return out
}

export const SqlTypeMap: any = {
    'string': ['varbinary', 'binary', 'time', 'char', 'varchar', 'tinytext', 'longtext', 'text'],
    'number': ['decimal', 'numeric', 'float', 'double', 'precision', 'tinyint', 'int', 'smallint', 'mediumint', 'year'],
    'date': ['timestamp', 'datetime', 'date'],
    'blob': ['blob', 'tinyblob', 'mediumblob', 'longblob'],
    'bigint': 'BigInt',
    'boolean': 'boolean',
}

export const valuesFromSetOrEnum = (cond: string): string[] => {
    cond = cond.replace(/\(|\)|'/g, '')
    if (cond.indexOf(',') === -1) { return [cond] }
    return cond.split(',')
}

export const getTypeFromSqlType = (field: string, type: string, cond: string): string => {   
    if (SqlTypeMap.string.includes(type)) { return 'string' }
    if (SqlTypeMap.number.includes(type)) { return 'number' }
    if (SqlTypeMap.date.includes(type)) { return 'Date' }
    if (SqlTypeMap.blob.includes(type)) { return 'Blob' }
    if (type === 'set') { 
        let values = valuesFromSetOrEnum(cond)
        if (values.length === 1) { return `Set<${getTypeFromValue(values[0])}>` }
        let type = getTypeFromValue(values[0])
        for (let i = 1; i < values.length; i++) if (getTypeFromValue(values[i]) !== type) { return 'Set<any>' }
        return `Set<${type}>`
    }
    if (type === 'enum') { return 'E' + pascalCase(field) }
    if (SqlTypeMap[type]) { return SqlTypeMap[type] }
    return 'any'
} 

export const interfaceFromTable = (tableName: string, fields: string) => {
    let typeDeclarations: string = ''
    let docInterface: string = addLine(`interface I${pascalCase(tableName)} {`)
    let r = new RegExp(REGEX_SQL_FIELDS)
    let match 
    while ((match = r.exec(fields))) {
        let [, field, sqlType, cond, opts] = match
        let type = getTypeFromSqlType(field, sqlType.toLowerCase(), cond)
        if (sqlType === 'enum') {
            typeDeclarations += addLine(`enum ${type} {`)
            let values = valuesFromSetOrEnum(cond)
            values.forEach((value: string) => typeDeclarations += addLine(value + ',', 1))
            typeDeclarations += addBreak('}')
        }
        if (field && !['PRIMARY', 'UNIQUE', 'KEY'].includes(field)) { docInterface += addLine(`${field}: ${type},`, 1) }
    }
    docInterface += addLine('}')

    return typeDeclarations + docInterface
}

export const sqlSchemaToClasses = (schema: string, dest: string, lib: string) => {
    let sql: string = fs.readFileSync(schema).toString().replace(/create table/gi, 'CREATE TABLE')
    let re: RegExp = new RegExp(REGEX_SQL_TABLES)
    let match: any

    while ((match = re.exec(sql))) {
        let [, tableName, fields] = match
        const interfaceFromTbl = interfaceFromTable(tableName, fields)
        let data = contentsToClass(interfaceFromTbl, interfaceFromTbl, lib || '', 'I')
        data.forEach((out: IGenerateClassOutput) => fs.writeFileSync(`${dest}/${out.dest}`, out.data))
    }

    return true
}

const formTypeMap: any = {
    password: 'password',
    radio: 'radio'
}

export const documentToHtml = (doc: IMongoDocument, formId?: string, indentLevel: number = 0, group?: string): string => {
    let html: string = ''
    if (formId) { html += addLine(`<form id="${formId}">`) }
    const keys = Object.keys(doc)
    keys.forEach((key: string) => {
        if (toString.call(doc[key]) === "[object Object]") {
            html += addLine(`<fieldset>`, 1 + indentLevel)
            html += addLine(`<legend>${key}</legend>`, 2 + indentLevel)
            html += addLine(`<p>`, 2 + indentLevel)
            html += documentToHtml(doc[key], undefined, 2 + indentLevel, key)
            html += addLine(`</p>`, 2 + indentLevel)
            html += addLine(`</fieldset>`, 1 + indentLevel)
        } else {
            
            const type = formTypeMap[key]
                ? formTypeMap[key]
                : formTypeMap[doc[key]]
                ? formTypeMap[doc[key]]
                : getTypeFromValue(doc[key]).toLowerCase()
            if (type === 'radio') {
                html += addLine(`<label for="${key}">${_f.keyToField(key)}</label><input type="radio" name="${group}[]" value="" class="input-${type}" />`, 2 + indentLevel)
            } else {
                html += addLine(`<p>`, 1 + indentLevel)
                html += addLine(`<label for="${key}">${_f.keyToField(key)}</label><input name="${key}" type="text" value="" class="input-${type}" />`, 2 + indentLevel)
                html += addLine(`</p>`, 1 + indentLevel)
            }
            
            
        }
    })
    if (formId) { html += addLine(`</form>`) }
    return html
}

export class MoxyORM {
    static interfacesToClass = interfacesToClass
    static interfaceFromDocument = interfaceFromDocument
    static documentToClass = documentToClass
    static importPathToSrc = importPathToSrc
    static parentDir = parentDir
    static sqlSchemaToClasses = sqlSchemaToClasses
    static documentToHtml = documentToHtml
}

export default MoxyORM