

import { interfacesToClass } from '../lib/moxy-orm'
import { Post } from '../lib/Post'
//interfacesToClass('lib/interfaces') // Generate classes

//Example use
let post = new Post()
                    .setAuthor('Author')
                    .setBody('Hello World!')

console.log(post.getAuthor(), 'says:', post.getBody())

export const currentDirectory = (): string => __dirname.indexOf('/') > -1 ? __dirname.split('/').pop() || '' : __dirname.split('\\').pop() || ''
export const absolutePath = (): string => ~__dirname.indexOf(':') ? __dirname.replace(/\\/g, '/').split(':')[1] : __dirname.replace(/\\/g, '/')

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
    console.log(src, dest, ' : ', pathNodes.join('/'))
    return pathNodes.join('/')
}

/* root + amount of different nodes */

/* should be -> ../Users/Daniel/Documents/Project/moxy-orm/a */
importPathToSrc('../a', '/b')

/* should be -> ../lib/interfaces/test */
importPathToSrc('../lib/interfaces/test', '../generated') 

/* should be -> ../lib/interfaces */
importPathToSrc('../lib/interfaces', '../generated') 

/* should be -> ../interfaces */
importPathToSrc('../lib/interfaces', '../lib/generated') 

/* should be -> ../../lib/interfaces */
importPathToSrc('../lib/interfaces', '../misc/generated') 

/* should be -> ../../../lib/interfaces */
importPathToSrc('../lib/interfaces', '../misc/generated/test') 

// folder: blah, test, misc,
// current folder being: 'test' 
// test/lib/interfaces | misc/generated
/* should be -> ../../test/lib/interfaces */
importPathToSrc('./lib/interfaces/', '../misc/generated') 

// same root
// should be -> ../../lib/interfaces
importPathToSrc('./lib/interfaces/', './misc/generated') 