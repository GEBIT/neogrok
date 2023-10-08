# neogrok

Neogrok is a frontend for [zoekt](https://github.com/sourcegraph/zoekt), a fast
and scalable code search engine. Neogrok exposes zoekt's search APIs in the form
of a modern, snappy UI.

There is a [demo deployment](./demo) at https://neogrok-demo-web.fly.dev/. This
deployment's configuration can serve as a guide for your own deployments of
neogrok; currently there are no packaged distributions.

## Configuration

Neogrok may be [configured](./src/lib/server/configuration.ts) using a JSON
configuration file, or, where possible, environment variables. Configuration
options defined in the environment take precedence over those defined in the
configuration file.

The configuration file is read from `/etc/neogrok/configuration.json` by
default, but the location may be customized using the environment variable
`NEOGROK_CONFIG_FILE`. The file is entirely optional, as all of the required
configuration may be defined in the environment. If it is present, the file's
contents must be a JSON object with zero or more entires, whose keys correspond
to the option names tabulated below.

### Configuration options

| Option name               | Environment variable name | Required Y/N | Description                                                                                                                        |
| :------------------------ | :------------------------ | :----------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `zoektUrl`                | `ZOEKT_URL`               | Y            | The base zoekt URL at which neogrok will make API requests, at e.g. `/api/search` and `/api/list`                                  |
| `openGrokProjectMappings` | N/A                       | N            | An object mapping OpenGrok project names to zoekt repository names; see [below](#renaming-opengrok-projects-to-zoekt-repositories) |

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
