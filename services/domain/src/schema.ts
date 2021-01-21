import { interfaceType, objectType, makeSchema, queryType, list, stringArg, nonNull } from 'nexus'
import { transformSchemaFederation } from 'graphql-transform-federation'
import * as path from "path";

const data = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Elya',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Eyre',
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Frost',
  },
]

const Node = interfaceType({
  name: 'Node',
  definition(t) {
    t.id('id')
  },
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.implements('Node')
    t.string('firstName')
    t.string('lastName')
    t.string('fullName', {
      resolve: (source) => {
        return source.firstName ?? '' + source.lastName
      }
    })
  },
})

const Query = queryType({
  definition(t) {
    t.field('me', {
      type: 'User',
      resolve: () => {
        return data[0]
      },
    })
    t.field('user', {
      type: ('User'),
      args: {
        id: nonNull(stringArg())
      },
      resolve: (_, { id }) => {
        return data.find(u => u.id === id) ?? null
      }
    })
    t.field('users', {
      type: list('User'),
      resolve: () => {
        return data
      },
    })
  },
})

const schema = makeSchema({
  types: [Node, User, Query],
  outputs: {
    typegen: path.join(__dirname, './typegen.ts'),
  },
  sourceTypes: {
    modules: [{
      module: path.join(__dirname, 'db.ts'),
      alias: 'db'
    }]
  },
  features: {
    abstractTypeStrategies: {
      resolveType: false
    }
  }
})

const federatedSchema = transformSchemaFederation(schema, {
  Query: {
    extend: true,
  },
  User: {
    keyFields: ['id'],
    resolveReference(reference: any) {
      return data.find(x => x.id === reference.id)
    },
  },
})

export default federatedSchema
