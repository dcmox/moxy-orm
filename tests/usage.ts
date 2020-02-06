
import { MoxyORM } from '../moxy-orm'

// src, dest, lib (dependencies)
MoxyORM.interfacesToClass('lib/interfaces', 'lib/gen', 'lib') // Generate classes

import { Post } from '../lib/gen/Post'

let post = new Post()
                    .setAuthor('Author')
                    .setBody('Hello World!')

console.log(post.getAuthor(), 'says:', post.getBody())

MoxyORM.sqlSchemaToClasses('tests/sql/test.sql', 'lib/gen', 'lib')

const doc = {
    date: new Date(),
    username: 'Test',
    password: 'Password',
    subscriptions: {
        monthly_membership: 'radio',
        yearly_membership: 'radio'
    }
}

console.log(MoxyORM.documentToHtml(doc, 'test'))
