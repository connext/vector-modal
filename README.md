# Vector Monorepo Widget/SDK/Example

## Documentation
Docs are available [`here`](http://docs.connext.network)

## Usage

This monorepo is setup for `@connext/` NPM organization. There are 2 modules by default:

- `@connext/vector-modal` - A React component for widget integration
- `@connext/vector-sdk` - A SDK for custom integration

## Local Development/Testing

Since the monorepo uses Lerna and Yarn Workspaces, npm CLI is not supported (only yarn).

```sh
yarn install
```

This will install all dependencies in each project, build them, and symlink them via Lerna

## Development workflow

In one terminal, run tsdx watch in parallel:

```sh
yarn start
```

This builds each package to `<modules>/<package>/dist` and runs the project in watch mode so any edits you save inside `<modules>/<package>/src` cause a rebuild to `<modules>/<package>/dist`. The results will stream to to the terminal.

### Using the example/playground

You can play with local modules in the Parcel-powered example/playground.

```sh
yarn start:app
```

This will start the example/playground on `localhost:1234`. If you have lerna running watch in parallel mode in one terminal, and then you run parcel, your playground will hot reload when you make changes to any imported module whose source is inside of `modules/*/src/*`. Note that to accomplish this, each package's `start` command passes TDSX the `--noClean` flag. This prevents Parcel from exploding between rebuilds because of File Not Found errors.

Important Safety Tip: When adding/altering modules in the playground, use `alias` object in package.json. This will tell Parcel to resolve them to the filesystem instead of trying to install the package from NPM. It also fixes duplicate React errors you may run into.

### Running Cypress

(In a third terminal) you can run Cypress and it will run your integration tests against the playground/example. If you want to keep integration tests and examples seperate you can copy the example folder to another folder called like `app` or whatever. Cypress will look for `localhost:1234` by default. If you change ports, also make sure to update [`.github/integration.yaml`](.github/integration.yml) as well.


### Release Instructions (Team)

just need to run, but make sure yarn.lock is up to date.

```sh
yarn run publish
```

Select the version needs to be released and wait for couple of mins.
