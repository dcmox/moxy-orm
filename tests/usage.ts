const fs = require('fs')

const interfacesToClass = (src: string) => {
    const path: string = src.substring(-1) === '/' ? src : `${src}/`
    let dest: any = path.split('/')
    dest.pop()
    let folder: string = dest.pop()
    dest = dest.join('/')
    console.log('dest', dest, 'folder', folder)
    console.log('==============')
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
const fileToClass = (path: string, imp: string, prefix: string = 'I'): any[] => {
    const contents = fs.readFileSync(path).toString()
    let r: RegExp = new RegExp(REGEX_INTERFACE)
    let cls: any
    let output: any[] = []

    while ((cls = r.exec(contents))) {
        let [, className, props] = cls
        if (prefix && className[0] === prefix) { className = className.slice(1) }
        let out: any = {dest: className + '.ts', data: `import { ${cls[1]} } from '${imp}'\n\n`}
        out.data += `export class ${className} {\n`
        let getters: string = ''
        let setters: string = ''
        let construct: string = ''
        let propInitializer: string = ''
        let fieldInitializer: string = ''
        let defaultMap: any = {
            string: `''`,
            number: `0`,
            boolean: `false`
        }
        out.data += `\tprivate props: ${cls[1]}\n`
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
        construct = `\tpublic constructor(fields?: ${cls[1]}) {\n`
        construct += `\t\tif (fields) {\n`
        construct += `\t\t\tthis.props = fields\n`
        construct += `\t\t} else {\n`
        construct += `\t\t\tthis.props = {\n`
        construct += propInitializer
        construct += `\t\t\t}\n`
        construct += `\t\t}\n`
        construct += `\t}\n`
        out.data += construct
        out.data += getters
        out.data += setters
        out.data += `}\n\n`
        output.push(out)
    }

    return output
}

interfacesToClass('tests/interfaces')


import { Post } from './Post'
let post = new Post()
post.setAuthor('blah').setBody('Hello world')
console.log(post.getAuthor(), post.getBody())