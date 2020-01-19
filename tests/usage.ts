

import { interfacesToClass } from '../lib/moxy-orm'
import { Post } from '../lib/gen/Post'
//interfacesToClass('lib/interfaces', 'lib/gen', 'lib') // Generate classes

let post = new Post()
                    .setAuthor('Author')
                    .setBody('Hello World!')

console.log(post.getAuthor(), 'says:', post.getBody())
