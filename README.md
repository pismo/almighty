# almighty

Tool used to standardize some common tasks in frontend projects

## Installation

  `npm install @pismo/almighty`

## Tasks

### Release

```
almighty release version (patch, minor, major) [--no-push]
```

Basically a version bump based on [semver] (http://semver.org/).
This task bump the desired version, change the CHANGELOG.md of the project to show the changes, commit and tag the version.

If you only want to make the version bump without pushing anything, just use the flag `--no-push`

`almighty release version (patch, minor, major) --no-push`

This task use some environment variables to make the communication with GitHub service:

- GIT_AUTH_TOKEN // GitHub authentication token

### Deploy

```
almighty deploy [-p dist]
```

By default, it deploys the contents of the `dist` folder to a bucket on S3. If the bucket does not exist, the bucket is created and configured to serve as a website.

You can define the path where almight will get the final distribution folder, with the `-p` (alias for --path) parameter.

The bucket is created based on the project name and the current branch. So if the project is `foo` and the branch is `bar` the bucket name will be `foo-bar`.

This task use some environment variables to make the communication with AWS service:

- GIT_BRANCH // git project branch
- AWS_REGION // aws region
- AWS_KEY // access key id
- AWS_SECRET // secret access key
- AWS_BUCKET // if this variable is not set, fallback will occurs for the project + branch

All assets that go up to the bucket already go up with configured cache system

### Rollbar

```
almighty rollbar
```

Notify the [rollbar](rollbar.com) about the new deploy.

This task use some environment variables to make the communication with rollbar service:

- ROLLBAR_SERVER_TOKEN // token to communicate with rollbar
- ROLLBAR_ENVIRONMENT // rollbar environment where the deploy was made
- BUILD_TAG // build version
- GIT_COMMIT // commit of the build
- USER // user that did the build (optional)

## TODO

- [ ] Add build task to be used for all projects
- [ ] Add lint task
- [ ] Add tests
- [ ] Improve params for each task
- [ ] Improve docs

## LICENSE

[MIT](https://github.com/pismo/almighty/blob/master/LICENSE)
