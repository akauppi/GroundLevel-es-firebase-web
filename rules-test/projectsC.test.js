/*
* rules-test/projectsC.test.js
*
* Rules tests
*
* Optimization note:
*   - use of 'Promise.all' to allow parallelism within a test may not bring much dividend. Jest runs tests in parallel
*     anyways so core should have things to do, even if within a test there would be waits.
*     This would need to be measured - e.g. these tests with multiple 'await's or with 'Promise.all'. #help
*/
import './tools/jest-matchers';

import { sessionProm } from './tools/guarded-session';

//const assert = require('assert').strict;
import { strict as assert } from 'assert';

import * as firebase from '@firebase/testing';

const FieldValue = firebase.firestore.FieldValue;

const anyDate = new Date();   // a non-server date

import { expect, describe, beforeAll } from '@jest/globals';

describe("'/projects' rules", () => {
  let unauth_projectsC, auth_projectsC, abc_projectsC, def_projectsC, ghi_projectsC;

  beforeAll( async () => {         // note: applies only to tests in this describe block
    const session = await sessionProm();

    try {
      const coll = session.collection('projects');

      unauth_projectsC = coll.as(null);
      auth_projectsC = coll.as({uid:'_'});
      abc_projectsC = coll.as({uid:'abc'});
      def_projectsC = coll.as({uid:'def'});
      ghi_projectsC = coll.as({uid:'ghi'});
    }
    catch (err) {
      // tbd. How to cancel the tests if we end up here? #help
      console.error( "Failed to initialize the Firebase database: ", err );
      throw err;
    }
  });

  //--- ProjectsC read rules ---

  test('unauthenticated access should fail', async () => {
    expect.assertions(1);
    await expect( unauth_projectsC.get() ).toDeny();
  });

  test('user who is not part of the project shouldn\'t be able to read it', async () => {
    expect.assertions(1);
    await expect( auth_projectsC.get() ).toDeny();
  });

  test('user who is an author or a collaborator can read a project (that is not \'removed\')', () => {
    expect.assertions(2);
    return Promise.all([
      expect( abc_projectsC.doc("1").get() ).toAllow(),
      expect( def_projectsC.doc("1").get() ).toAllow()
    ]);
  });

  test('user needs to be an author, to read a \'removed\' project', () => {
    expect.assertions(2);
    return Promise.all([
      expect( abc_projectsC.doc("2-removed").get() ).toAllow(),
      expect( def_projectsC.doc("2-removed").get() ).toDeny()
    ]);
  });

  //--- ProjectsC create rules ---

  test('any authenticated user may create a project, but must include themselves as an author', () => {
    // This implies: unauthenticated users cannot create a project, since they don't have a uid.

    const serverTimestamp = FieldValue.serverTimestamp();

    const p3_valid = {
      title: "Calamity",
      created: serverTimestamp,
      // no 'removed'
      authors: ["abc"],
      collaborators: []
    };

    const p3_withoutAuthor = {...p3_valid, authors: [] };
    const p3_badTime = {...p3_valid, created: anyDate };
    const p3_alreadyRemoved = {...p3_valid, removed: serverTimestamp };

    expect.assertions(4);
    return Promise.all([
      expect( abc_projectsC.doc("3-fictional").set(p3_valid) ).toAllow(),
      expect( abc_projectsC.doc("3-fictional").set(p3_withoutAuthor) ).toDeny(),

      // Time stamp must be the server time
      expect( abc_projectsC.doc("3-fictional").set(p3_badTime) ).toDeny(),

      // May not be already 'removed'
      expect( abc_projectsC.doc("3-fictional").set(p3_alreadyRemoved) ).toDeny()
    ]);
  });

  //--- ProjectsC update rules ---

  test("An author can change '.title'", () => {
    const p1mod = {
      title: "Calamity 2"
    };
    expect.assertions(2);
    return Promise.all([
      expect( abc_projectsC.doc("1").update(p1mod) ).toAllow(),
      expect( def_projectsC.doc("1").update(p1mod) ).toDeny()    // collaborator
    ]);
  });

  test("An author can not change the creation time", () => {
    const p1mod = {
      created: FieldValue.serverTimestamp()
    };
    expect.assertions(2);
    return Promise.all([
      expect( abc_projectsC.doc("1").update(p1mod) ).toDeny(),
      expect( def_projectsC.doc("1").update(p1mod) ).toDeny()  // collaborator
    ]);
  });

  test("An author can mark a project '.removed'", () => {
    const p1mod = {
      removed: FieldValue.serverTimestamp()
    };
    expect.assertions(2);
    return Promise.all([
      expect( abc_projectsC.doc("1").update(p1mod) ).toAllow(),
      expect( def_projectsC.doc("1").update(p1mod) ).toDeny()  // collaborator
    ]);
  });

  test("An author can remove the '.removed' mark", async () => {
    const p2mod = {
      removed: FieldValue.delete()
    };

    expect.assertions(2);
    await expect( abc_projectsC.doc("2-removed").update(p2mod) ).toAllow();
    await expect( def_projectsC.doc("2-removed").update(p2mod) ).toDeny();  // collaborator
  });

  test("An author can add new authors, and remove authors as long as one remains", () => {
    const p1_addAuthor = {
      authors: FieldValue.arrayUnion("zxy")
    };
    const p3_removeAuthor = {
      authors: FieldValue.arrayRemove("def")
    };
    const p1_removeAuthor = {
      authors: FieldValue.arrayRemove("abc")    // only author
    };

    expect.assertions(5);
    return Promise.all([
      expect( abc_projectsC.doc("1").update(p1_addAuthor) ).toAllow(),
      expect( abc_projectsC.doc("3-multiple-authors").update(p3_removeAuthor) ).toAllow(),

      // Possible Firestore emulator bug: if we remove the author with '{ authors: [] }', we are denied.
      //    If we remove it with 'FieldValue.arrayRemove', we are allowed.
      //
      expect( abc_projectsC.doc("1").update(p1_removeAuthor) ).toDeny(),  // only author
      expect( abc_projectsC.doc("1").update( { authors: [] }) ).toDeny(),  // only author

      expect( ghi_projectsC.doc("3-multiple-authors").update(p3_removeAuthor) ).toDeny()  // collaborator
    ]);
  });

  /*
  * Likely gets removed. Adding new users to a project would be the work of Cloud Functions, as part of invites.
  *
  test("An author can add or remove collaborators", async () => {
    const p1_addCollaborator = {
      collaborators: FieldValue.arrayUnion("xyz")
    };
    await expect( abc_projectsC.doc("1").update(p1_addCollaborator) ).toAllow();
    await expect( def_projectsC.doc("1").update(p1_addCollaborator) ).toDeny();   // collaborator

    // not testing removal - we likely toss this away?
  });
  */

  //--- ProjectsC delete rules ---

  test('no user should be able to delete a project (only cloud functions or manual)', async () => {
    expect.assertions(1);
    await expect( abc_projectsC.doc("1").delete() ).toDeny();   // is an author in that project
  });
});

