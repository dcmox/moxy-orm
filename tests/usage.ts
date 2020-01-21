
import { MoxyORM } from '../moxy-orm'

// src, dest, lib (dependencies)
MoxyORM.interfacesToClass('lib/interfaces', 'lib/gen', 'lib') // Generate classes

import { Post } from '../lib/gen/Post'

let post = new Post()
                    .setAuthor('Author')
                    .setBody('Hello World!')

console.log(post.getAuthor(), 'says:', post.getBody())

MoxyORM.sqlSchemaToClasses('tests/sql/test.sql', 'lib/gen', 'lib')

