# Schema

This directory houses copies of Telemetry GraphQL schemas from upstream [github.com/sourcegraph/sourcegraph](https://github.com/sourcegraph/sourcegraph).

- `shared.graphql` has a copy of core types used across Sourcegraph's GraphQL schemas. It generally does not need to be updated.
- `telemetry.graphql` has a copy of the [telemetry mutation input types defined upstream](https://github.com/sourcegraph/sourcegraph/blob/main/cmd/frontend/graphqlbackend/telemetry.graphql).

Once updated:

```sh
npm run generate
```
