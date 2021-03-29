# Approach


## Managing a monorepo

This is a monorepo. That means that there are multiple subprojects under the one umbrella. These have to do with each other, but could also be kept in separate repos.

|||dev|testing|deploy|monitoring|
|---|---|---|---|---|---|
|`packages/app`|Front-end application|☑️|☑️|-|-|
|`packages/app-deploy-ops`|Front-end application|-|-|☑️|☑️|
|`packages/backend`|Back-end|☑️|☑️|☑️|?|

This splitting is an important thing. It allows you - as a lone developer - to focus on a certain subdomain of your application instead of the overwhelming feeling when there are simply too many things "up in the air". It facilitates *interfaces*, and interfaces are good for *testability*.

Most repos the author has seen are not like this. Either one has separate (teams?) for back end and front end; at least separate repos. Or one pours too much into the same directory, living on hope, but exhausting it.

The three repos are connected, of course. They have `file:...` links which means you don't have to publish any of the repos anywhere. They are simply build-walled separations of concern.

At places, this arrangement is a bit tedious. You must separately update dependencies in all three repos, but now you know it's by design and the alternative would - likely - be (much) worse.

### Alternative: `npm@7` workspaces?

Tried it. Did I miss something?

See [Wishes for npm.md](DEVS/Wishes%20for%20npm.md).


## IDE freedom

The author uses [WebStorm](https://www.jetbrains.com/webstorm/) and it's really, really good.

However, IDEs are a personal thing so the repo tries to be agnostic of one's choice. This is why formatting guidance are in `.editorconfig` files.


## Supporting actors

In the process of creating the repo, the author ended up creating these `npm` libraries to help:

- [firebase-jest-testing](https://github.com/akauppi/firebase-jest-testing) for helping test Firebase back-ends
- [aside-keys](https://github.com/akauppi/aside-keys/tree/master/packages/aside-keys) for authentication UI side

Such libraries are intentionally outside of the repo, just like existing help components (or ones that you create for your application) might be.

The Docker image created for Cloud Build also deserves a mention: 🏅

- [firebase-custom-builder](https://github.com/akauppi/firebase-custom-builder) for testing with Firebase emulators, in CI/CD


## CI/CD

Chose to place *all* the CI/CD specific files in the `builds/` subfolder.

This is conscious, to avoid complexity creep if such files were spread around the repo. Also, it's about roles. The backend sub-package knows how it can be tested. It does not *care* who does it, in which cloud, under which circumstances.

This also makes it easier to switch the CI/CD provider. In a way, CI/CD is yet another *orthogonal* choice, in addition to **development** ("which web app framework should we use"), and **ops** ("which logging/alerting infrastructure").

<!-- tbd. picture of three axis -->
