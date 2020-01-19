import assert from 'assert'
import sinon from 'sinon'
import * as testData from './testData'
import * as testSuite from '../lib/moxy-orm'

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
        let interfaceString = testSuite.interfaceFromDocument('Test', docs)
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
        let result = testSuite.documentToClass('Post', doc, './tests/')
        assert.equal(result, true)
    })
})