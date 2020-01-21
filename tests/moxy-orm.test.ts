import assert from 'assert'
import * as testData from './testData'
import { MoxyORM } from '../moxy-orm'

describe('MoxyORM Test Suite', () => {
    it('Should convert a class into an Interface', () => {
        /* Tests for various formats for documentToClass */
        let docs: any = [
            {
                test: 'Hello world',
            },
            {
                date: new Date(),
                blah: ['test','blah'],
                arg: [[1, 2], [3, 4]],
                argB: [{test: 1, abc: 2,}, {test: 1, abc: 3}],
                bool: false,
                num: 5.5,
                str: 'String!',
                arr: [5, 4, 3],
            }
        ]
        let interfaceString = MoxyORM.interfaceFromDocument('Test', docs)
        assert.equal(interfaceString, testData.interfaceString)
    })
    it(`Should create a class based on a provided interface`, () => {
        let doc: any = [{
            date: new Date(),
            author_id: 1,
            author: 'Daniel Moxon',
            body: 'Hello world!',
            likes: 5,
            comments: [
                {author_id: 2, comment: 'Great post!'}, 
                {author_id: 3, comment: 'Keep the content coming!'}
            ]
        }]
        let result = MoxyORM.documentToClass('Post', doc, './tests/', './lib')
        assert.equal(result, true)
    })

    it('Should be able to determine the relative or absolute path based on a source and destination', () => {
        let actual
        let expected
        
        // Support for paths in Windows
        actual = MoxyORM.importPathToSrc('../a', 'D:/b')
        expected = MoxyORM.parentDir(process.cwd().replace(/\\/g, '/')) + '/a'
        assert.equal(actual, expected, 'Different drives')

        actual = MoxyORM.importPathToSrc('../a', '/b')
        expected = MoxyORM.parentDir(process.cwd().replace(/\\/g, '/')) + '/a'
        if (~expected.indexOf(':')) { expected = expected.split(':')[1] }
        assert.equal(actual, expected, 'Absolute vs relative path')

        actual = MoxyORM.importPathToSrc('./lib/interfaces/test', './generated') 
        expected = '../lib/interfaces/test'
        assert.equal(actual, expected, 'Different paths in the current folder')

        actual = MoxyORM.importPathToSrc('../lib/interfaces', '../generated') 
        expected = '../lib/interfaces'
        assert.equal(actual, expected, 'Different paths in the previous folder')

        actual = MoxyORM.importPathToSrc('../lib/interfaces', '../lib/generated') 
        expected = '../interfaces'
        assert.equal(actual, expected, 'Different paths in the previous folder test 2')

        actual = MoxyORM.importPathToSrc('../lib/interfaces', '../misc/generated')
        expected = '../../lib/interfaces'
        assert.equal(actual, expected, 'Different paths in the previous folder test 3')

        actual = MoxyORM.importPathToSrc('../lib/interfaces', '../misc/generated/test') 
        expected = '../../../lib/interfaces'
        assert.equal(actual, expected, 'Different paths in the previous folder test 4')

        actual = MoxyORM.importPathToSrc('./interfaces/', '../misc/generated')
        expected = '../../moxy-orm/interfaces'
        assert.equal(actual, expected, 'Different paths current and previous folder')

        actual = MoxyORM.importPathToSrc('./lib/interfaces/', './misc/generated') 
        expected = '../../lib/interfaces'
        assert.equal(actual, expected, 'Different paths in the current folder')

        actual = MoxyORM.importPathToSrc('../lib/interfaces/', '../../misc/generated') 
        expected = '../../../lib/interfaces'
        assert.equal(actual, expected, 'Different paths in previous folders')
    })
})