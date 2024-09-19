# neogrok

Neogrok is a frontend for [zoekt](https://github.com/sourcegraph/zoekt), a fast
and scalable code search engine. Neogrok exposes zoekt's search APIs in the form
of a modern, snappy UI. Neogrok is a SvelteKit application running on Node.js
and in the browser.

## GEBIT-specific features

This repository contains some features not present in the fantastic
[original neogrok repository](https://github.com/isker/neogrok):

- Secured access to the search interface via Keycloak/OIDC
- Repository access control to limit search results to only those git
  repositories, to which the logged in user has access to.
  Requires a [custom version](https://github.com/GEBIT/zoekt) of zoekt,
  which uses the userId passed by neogrok to select the user-accessible shards.
- The possibility to change the title to something else than 'neogrok'

## Features and usage

Together, neogrok and zoekt provide:

- Fast, live code search with a syntax based on regular expressions.
- Easy deployments. A single deployment of zoekt can performantly index and
  serve thousands of source repositories, using one of the many available
  indexers like
  [`zoekt-git-index`](https://github.com/sourcegraph/zoekt/blob/main/cmd/zoekt-git-index/)
  to produce binary index files (called "shards") that are served by
  [`zoekt-webserver`](https://github.com/sourcegraph/zoekt/tree/main/cmd/zoekt-webserver).
  Neogrok is just a veneer on top of `zoekt-webserver`; the only necessary
  configuration for neogrok is the URL of a running `zoekt-webserver`.
- Low resource utilization. The demo (which just indexes the neogrok and zoekt
  repos) happily runs on the smallest instances Fly can provision. Indexing
  the Linux kernel produces about 2.7GiB of index shards, and serving those
  shards uses just under 1 GiB of RAM.

## Installing

Building from source is easy. Clone the repository,
`yarn install && yarn run build && yarn run start`. You can of course run the server
without intermediation by `yarn`, by doing whatever `yarn run start` does directly;
but the relevant commands may change in the future, whereas `yarn run start` will
not.

## Deploying

The demo deployment is configured [in this repository](./demo). This configuration
can serve as a guide for your own deployments of neogrok together with zoekt.

## Configuration

Neogrok may be [configured](./src/lib/server/configuration.ts) using a JSON
configuration file, or, where possible, environment variables. Configuration
options defined in the environment take precedence over those defined in the
configuration file.

The configuration file is read from `/etc/neogrok/config.json` by
default, but the location may be customized using the environment variable
`NEOGROK_CONFIG_FILE`. The file is entirely optional, as all of the required
configuration may be defined in the environment. If it is present, the file's
contents must be a JSON object with zero or more entries, whose keys correspond
to the option names tabulated below.

### Configuration options

| Option name               | Environment variable name | Required Y/N | Description                                                                                                                        |
| :------------------------ | :------------------------ | :----------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `zoektUrl`                | `ZOEKT_URL`               | Y            | The base zoekt URL at which neogrok will make API requests, e.g. `http://localhost:6070`                                           |
| `neogrokTitle`            | `NEOGROK_TITLE`           | N            | The title to be displayed on the front page, defaults to NEOGROK                                                                   |
| `openGrokProjectMappings` | N/A                       | N            | An object mapping OpenGrok project names to zoekt repository names; see [below](#renaming-opengrok-projects-to-zoekt-repositories) |

### SvelteKit environment variables

Note that you can also configure, among other things, which ports/addresses will
be bound, using SvelteKit's Node environment variables. See the list
[here](https://kit.svelte.dev/docs/adapter-node#environment-variables).

### Authentication + authorization

This version of neogrok requires authentication in order to access the search interface.

So far, only Keycloak is supported, with OpenID Connect as protocol. The library
being used, [Auth.js](https://authjs.dev/), has many more options.

Authentication and authorization are configured through these environment variables:

| Environment variable name | Required Y/N | Description                                                                                                                                                  |
| :------------------------ | :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_KEYCLOAK_ISSUER`            | Y            | The URL of your Keycloak issuer endpoint. E.g. https://your.keycloak.com/realms/master                                                               |
| `AUTH_KEYCLOAK_REFRESH`           | N            | The URL of your refresh token endpoint. Defaults to $AUTH\_KEYCLOAK\_ISSUER/protocol/openid-connect/token                                            |
| `AUTH_KEYCLOAK_ID`                | Y            | The clientId configured in your Keycloak instance for this neogrok service                                                                           |
| `AUTH_KEYCLOAK_SECRET`            | Y            | The client secret in your Keycloak instance for this neogrok service                                                                                 |
| `AUTH_KEYCLOAK_USER_ID_ATTRIBUTE` | N            | The attribute in the `profile` claim holding the user name to be passed to zoekt for access control. Defaults to `preferred_username`                |
| `AUTH_KEYCLOAK_GROUPS_ATTRIBUTE`  | N            | The attribute in the `access token` holding the group memberships of the user. Only needed with `AUTH_KEYCLOAK_REQUIRED_GROUP`. Defaults to `groups` |
| `AUTH_KEYCLOAK_REQUIRED_GROUP`    | N            | Optionally, the name of a group the user must be a member of, before access is granted. Used with `AUTH_KEYCLOAK_GROUPS_ATTRIBUTE`                   |

**Note 1:**
The above only configures access to the neogrok web interface.
Access control wrt the search base is implemented in [this custom version of zoekt](https://github.com/GEBIT/zoekt),
which evalutes the userId passed from neogrok against an access control list, so that
only search results to the user-accessible repositories are returned.

**Note 2:**
In order to use authorization based on group membership, you may need to configure
the client scope in your Keycloak instance to provide the user's group memberships
as an attribute in the access token.

### Prometheus metrics

Neogrok exports some basic [Prometheus](https://prometheus.io/)
[metrics](./src/lib/server/metrics.ts) on an opt-in basis, by setting a
`PROMETHEUS_PORT` or `PROMETHEUS_SOCKET_PATH`, plus an optional
`PROMETHEUS_HOST`. These variables have the exact same semantics as the
above-described SvelteKit environment variables, but the port/socket must be
different than those of the main application. When opting in with these
variables, `/metrics` will be served at the location they describe.

`/metrics` is required to be served with a different port/socket so as to not
expose it on the main site; serving one port to end users and another to the
prometheus scraper is the easiest way to ensure proper segmentation of the
neogrok site from internal infrastructure concerns, without having to run a
particularly configured HTTP reverse proxy in front of neogrok.

## OpenGrok compatibility

As an added bonus, neogrok can serve as a replacement for existing deployments
of [OpenGrok](https://oracle.github.io/opengrok/), a much older, more intricate,
slower, and generally jankier code search engine than zoekt. Neogrok strives to
provide URL compatibility with OpenGrok by redirecting OpenGrok URLs to their
neogrok equivalents: simply deploy neogrok at the same origin previously hosting
your OpenGrok instance, and everything will Just Work™. To the best of our
ability, OpenGrok Lucene queries will be rewritten to the most possibly
equivalent zoekt queries. (Perfect compatibility is not possible as the feature
sets of each search engine do not map one-to-one.)

### Renaming OpenGrok projects to zoekt repositories

If your OpenGrok project names are not identical to their equivalent zoekt
repository names, you can run `neogrok` with the appropriate
[`openGrokProjectMappings` configuration](#configuration), which maps OpenGrok
project names to zoekt repository names. With this data provided, neogrok can
rewrite OpenGrok queries that include project names appropriately.
