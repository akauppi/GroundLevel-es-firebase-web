# Back-end

Back-end features for [GroundLevel-es-firebase](https://github.com/akauppi/GroundLevel-es-firebase) sample application.

Responsible for:

- implementation and documentation of the back-end
   - data structures
   - access rights
- testing the back-end


## Requirements

- `npm`
- `firebase-tools`

   ```
   $ npm install -g firebase-tools
   ```

It's good to update `firebase-tools` every now and then, especially if you have some difficulties.

<!-- 
developed with:
- macOS 11.2
- node 15.x
- npx 7.x
- firebase CLI 9.6.x
-->

## Getting started

```
$ npm install
```

>Note: There is a separate `functions/node_modules` for the emulated Cloud Functions. Its packages will be installed/updated automatically, with this command.

```
$ npm run ci
```

The tests should pass, or be skipped.

## Development workflow

```
$ npm run start
```

This launches the Firebase emulator in one console, and automatically picks up changes to the sources.

You can then run individual tests against it (see `package.json` for the precise name of commands).

e.g. 

```
$ npm run test:fns:userInfo
```

## Deploying

```
$ firebase use --add
```

Inform the project's location to Firebase Functions by:

```
$ firebase functions:config:set regions.0="(your project's location)"
```

---

>You can see the project's location either in [Firebase Console](https://console.firebase.google.com) > Project > App > ⚙️ > `Default GCP resource location`.
>
>..or by:
>
```
$ firebase apps:sdkconfig
...
firebase.initializeApp({
  "projectId": "groundlevel-160221",
   	 ...
  "locationId": "europe-west6",
    ...
});
```

```
$ npm run deploy
```

