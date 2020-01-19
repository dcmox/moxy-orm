const fs = require('fs')

export const interfacesToClass = (src: string) => {
    const path: string = src.substring(-1) === '/' ? src : `${src}/`
    let dest: any = path.split('/')
    dest.pop()
    let folder: string = dest.pop()
    dest = dest.join('/')
    let interfaces: any[] = fs.readdirSync(src)

    interfaces.forEach((f: string) => {
        const imp: string = `${folder}/${f.replace('.ts', '')}`
        const fp: string = `${src}/${f}`
        const contents: any[] = fileToClass(fp, imp)
        contents.forEach((content: any) => {
            fs.writeFileSync(`${dest}/${content.dest}`, content.data)
        })
    })
    return true
}

const REGEX_INTERFACE = /interface ([^{]+)? {([^}]+)}/g

// support reading database table and converting to class/interface as well? auto-detect types.
// support manual updates to classes -> if re-running the generator, find the extra functions and merge them into the new class.
// try and support changes to the existing functions if possible. Maybe have functionality to allow data to be formatted like:
// getFnFormatted() and automatically prefer formatted Function if available.

/* 
but I'm going to have it read database tables and generate classes / interfaces as wel
will support both mongo DB and MySQL and have a converter to convert SQL to MongoDB and vice versa
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

export const documentToClass = (collectionName: string, docs: IMongoDocument[], outputDir: string): boolean => {
    let interfaceFromDoc: string = interfaceFromDocument('I' + collectionName, docs)
    let data = contentsToClass(interfaceFromDoc, interfaceFromDoc, 'I')
    if (data[0]) {
        fs.writeFileSync(`${outputDir}/${collectionName}.ts`, data[0].data)
        return true
    }
    return false
}

export const fileToClass = (path: string, interfaceOrImport: string, prefix: string = 'I'): IGenerateClassOutput[] => {
    const contents = fs.readFileSync(path).toString()
    return contentsToClass(contents, interfaceOrImport, prefix)
}

export const contentsToClass = (contents: string, interfaceOrImport: string, prefix: string = ''): IGenerateClassOutput[] => {
    let r: RegExp = new RegExp(REGEX_INTERFACE)
    let cls: any
    let output: any[] = []

    while ((cls = r.exec(contents))) {
        let [, className, props] = cls
        if (prefix && className[0] === prefix) { className = className.slice(1) }

        const out: IGenerateClassOutput = generateClass(className, props, interfaceOrImport, cls[1])
        output.push(out)
    }

    return output
}

interface IGenerateClassOutput {
    dest: string,
    data: string
}

/* 
    Need path to define LIB folder. need to figure out relative IMPORT path to any given file, eg:
    FileA:
    import { blah } from '../../path/to/lib/'
*/
/* Allow path to be defined to export */
export const generateClass = (className: string, props: string, interfaceOrImport?: string, iClassName?: string): IGenerateClassOutput => {
    if (!iClassName) { iClassName = className }
    let out: IGenerateClassOutput
    let dbModelImport: string = `import { DBModel } from './DBModel'\n`
    if (interfaceOrImport && ~interfaceOrImport.indexOf('{')) {
        out = { dest: className + '.ts', data: dbModelImport + `${interfaceOrImport}\n` }
    } else {
        out = interfaceOrImport
        ? { dest: className + '.ts', data: dbModelImport + `import { ${iClassName} } from '${interfaceOrImport}'\n\n` }
        : { dest: className + '.ts', data: dbModelImport }
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
        boolean: `false`
    }

    out.data += `\tprivate props: ${iClassName}\n`
    props.split(',').forEach((prop: string) => {
        if (!prop.trim()) { return }
        let [key, type] = prop.replace(/\t|\n/g, '').trim().split(':').map((v: string) => v.trim())
        let isOptional = key.indexOf('?') > -1
        let orUndefined:string = ''
        if (isOptional) { 
            key = key.substring(0, key.length - 1) 
            orUndefined = ' | undefined'
        }
        let properKey = key.slice(0, 1).toUpperCase() + key.slice(1)
        propInitializer += `\t\t\t\t${key}: ${defaultMap[type]},\n`
        getters += `\tpublic get${properKey}(): ${type}${orUndefined} {\n\t\treturn this.props.${key}\n\t}\n`
        setters += `\tpublic set${properKey}(value: ${type}): ${className} {\n\t\tthis.props.${key} = value\n\t\treturn this\n\t}\n`
    })

    construct = `\tpublic constructor(fields?: ${iClassName}) {\n`
    construct += `\t\tsuper(fields)\n`
    construct += `\t\tif (fields) {\n`
    construct += `\t\t\tthis.props = fields\n`
    construct += `\t\t} else {\n`
    construct += `\t\t\tthis.props = {\n`
    construct += propInitializer
    construct += `\t\t\t}\n`
    construct += `\t\t}\n`
    construct += `\t\treturn this\n`
    construct += `\t}\n`

    out.data += construct
    out.data += getters
    out.data += setters
    out.data += `}\n\n`
    return out
}