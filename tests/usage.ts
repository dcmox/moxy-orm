

import { interfacesToClass } from '../lib/moxy-orm'
import { Post } from '../lib/Post'
//interfacesToClass('lib/interfaces') // Generate classes

//Example use
let post = new Post()
                    .setAuthor('Author')
                    .setBody('Hello World!')

console.log(post.getAuthor(), 'says:', post.getBody())
