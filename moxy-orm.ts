const fs = require('fs')

export const currentDirectory = (): string => __dirname.indexOf('/') > -1 ? __dirname.split('/').pop() || '' : __dirname.split('\\').pop() || ''
export const absolutePath = (): string => ~__dirname.indexOf(':') ? __dirname.replace(/\\/g, '/').split(':')[1] : __dirname.replace(/\\/g, '/')
export const parentDir = (path: string) => {
    if (~path.indexOf('/')) {
        let tmp = path.split('/')
        tmp.pop()
        return tmp.join('/')
    }
    return path
}

// from any path, eg, an interface file. create an output class that can reference the src.
export const importPathToSrc = (src: string, dest: string): string => {
    if (src.startsWith('/')) { return src }
    // Paths must be consistent
    if (src.endsWith('/')) { src = src.slice(0, src.length - 1) }
    if (dest.endsWith('/')) { dest = dest.slice(0, dest.length - 1) }

    // Force src to be whole path
    if (dest.startsWith('/') || dest.startsWith('\\')) { 
        let path: any = absolutePath() 
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

    if (!src.startsWith('.') && !src.startsWith('/')) { src = './' + src }
    if (!dest.startsWith('.') && !dest.startsWith('/') && !dest.startsWith('\\')) { dest = './' + dest }

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
        destNodes = [srcRoot, cdir, ...destNodes.slice(1)]
        destRoot = '..'
    }

    if (srcRoot === destRoot) {
        if (destNodes.length >= srcNodes.length) {
            let i = 1
            for (;i < srcNodes.length; i++) { if (srcNodes[i] != destNodes[i]) { break } }
            pathNodes = [...new Array(destNodes.length - i).fill('..')]
            for (;i < srcNodes.length; i++) { pathNodes.push(srcNodes[i]) }
        } else {
            let i = 1
            for (;i < destNodes.length; i++) { if (destNodes[i] != srcNodes[i]) { break } }
            pathNodes = [...new Array(destNodes.length - i).fill('..')]
            for (;i < srcNodes.length; i++) { pathNodes.push(srcNodes[i]) }
        }
    }
    return pathNodes.join('/')
}

export const interfacesToClass = (src: string, dest?: string, lib?: string) => {
    const path: string = src.substring(-1) === '/' ? src : `${src}/`
    if (dest === undefined) { dest = `${src}/gen` }
    if (lib === undefined) { lib = `${src}` }
    let interfaces: any[] = fs.readdirSync(src)
    interfaces.forEach((f: string) => {
        //const imp: string = `${folder}/${f.replace('.ts', '')}`
        const fp: string = `${src}/${f}`
        const contents: any[] = fileToClass(fp, dest || '', lib || '')
        contents.forEach((content: any) => {
            fs.writeFileSync(`${dest}/${content.dest}`, content.data)
        })
    })
    return true
}

const REGEX_INTERFACE = /interface ([^{]+)? {([^}]+)}/g

/* 
    TODO: 
        * Add support for reading MySQL schemas (use logic from MoxyPHP)
        * Build SQL -> MongoDB converter
        * Build MongoDB -> SQL converter
*/

interface IMongoDocument { [key: string]: any }

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
    let docInterface: string = `interface ${collectionName} {\n`
    let document: IMongoDocument = {}
    docs.forEach((doc: any) => { document = Object.assign(document, doc) })
    Object.keys(document).forEach((key: string) => {
        let type: string = typeof document[key]
        if (type === 'object') {
            type = getTypeFromValue(document[key])
        }
        docInterface += `\t${key}: ${type},\n`
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

interface IGenerateClassOutput {
    dest: string,
    data: string
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
        out = { dest: className + '.ts', data: libImport + `\n${interfaceOrDestination}\n\n` }
    } else {
        out = interfaceOrDestination
        ? { dest: className + '.ts', data: libImport + addBreak(`import { ${iClassName} } from '${interfaceOrDestination}'`) }
        : { dest: className + '.ts', data: libImport }
    }

    // extends DBModel 
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
        let properKey = key.slice(0, 1).toUpperCase() + key.slice(1)
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

const addBreak = (line: string, numberOfBreaks: number = 2) => line + new Array(numberOfBreaks).fill('\n').join('')
const addLine = (line: string, tabs: number = 0, useSpaces: number = 0) => useSpaces 
    ? new Array(useSpaces * tabs).fill(' ').join('') + line + '\n'
    : new Array(tabs).fill('\t').join('') + line + '\n'

export class MoxyORM {
    static interfacesToClass = interfacesToClass
    static interfaceFromDocument = interfaceFromDocument
    static documentToClass = documentToClass
    static importPathToSrc = importPathToSrc
    static parentDir = parentDir
}

export default MoxyORM