import { interfaceType, objectType, makeSchema, queryType } from 'nexus'
import { transformSchemaFederation } from 'graphql-transform-federation'
import * as path from "path";

interface Score {
  id: string
  score: number
}

const data: Score[] = [
  {
    id: '1',
    score: 30,
  },
  {
    id: '2',
    score: 10,
  },
  {
    id: '3',
    score: 20,
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
    t.int('score', {
      resolve: (source) => {
        const match = data.find(u => u.id === source.id)
        return match!.score
      }
    })
  },
})

const Query = queryType({
  definition(t) {
    t.int('highest', {
      resolve: () => {
        const highSeen = 0
        const userWithHighest = data.find(u => u.score > highSeen)
        return userWithHighest!.score
      }
    }
    )
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
    extend: true,
    fields: {
      id: {
        external: true,
      },
    },
    keyFields: ['id'],
  },
})

export default federatedSchema
