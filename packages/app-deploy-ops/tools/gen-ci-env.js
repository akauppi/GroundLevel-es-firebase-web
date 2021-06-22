/*
* tools/gen-ci-env.js
*
* Prepares an env file, based on the active Firebase project.
*
* Usage:
*   <<
*     node --harmony-top-level-await tools/gen-ci-env.js
*   <<
*
* Context:
*   - run in CI; there is an active Firebase project
*
* Output to stdout.
*/
import { execSync } from 'child_process'

const output = execSync("firebase apps:sdkconfig", { encoding: 'utf8' } );

/*
* Output:
* <<
*   // Copy and paste this into your JavaScript code to initialize the Firebase SDK.
*   // You will also need to load the Firebase SDK.
*   // See https://firebase.google.com/docs/web/setup for more details.
*
*   firebase.initializeApp({
*     "projectId": "...",
*     "appId": "...",
*     "storageBucket": "...",
*     "locationId": "...",
*     "apiKey": "...",
*     "authDomain": "...",
*     "messagingSenderId": "...",
*     "measurementId": "..."
*   });
* <<
*/

const Re = /firebase\.initializeApp\(({.+})\)/ms;

const [_,c1] = Re.exec(output);

const { projectId, appId, locationId, apiKey, authDomain } = JSON.parse(c1);

if (! (projectId && appId && locationId && apiKey && authDomain)) {
  console.error("Unexpected 'firebase apps:sdkconfig' output!");
  process.exit(3);
}

const out =
  `export default ${ JSON.stringify( { projectId, appId, locationId, apiKey, authDomain }) };`;

process.stdout.write(out);
