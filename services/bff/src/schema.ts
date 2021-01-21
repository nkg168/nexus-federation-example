import { interfaceType, objectType, makeSchema, queryType, list } from 'nexus'
import { transformSchemaFederation } from 'graphql-transform-federation'
import * as path from "path";

interface User {
  id: string
  showPremiumBanner: boolean
}

const data: User[] = [
  {
    id: '1',
    showPremiumBanner: true,
  },
  {
    id: '2',
    showPremiumBanner: false,
  },
  {
    id: '3',
    showPremiumBanner: true,
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
    t.boolean('showPremiumBanner',
      {
        resolve: (source) => {
          const match = data.find(u => u.id === source.id)
          return match!.showPremiumBanner
        }
      })
  },
})

const Query = queryType({
  definition(t) {
    t.field('premiumUsers', {
      type: list('User'),
      resolve() {
        return data.filter(u => u.showPremiumBanner)
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