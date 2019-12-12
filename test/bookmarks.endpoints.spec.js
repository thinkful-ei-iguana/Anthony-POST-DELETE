const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });

    app.set('db', db);
  });

  const cleanBookmarks = () => db('bookmarks').truncate();
  before('clean the table', cleanBookmarks);
  afterEach('clean the table', cleanBookmarks);

  after('disconnect from db', () => db.destroy());

  describe('Unauthorized Request', () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach('insert bookmarks', () => {
      return db.into('bookmarks').insert(testBookmarks);
    });
    it('Should respond with 401 unauthorized access /GET /bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(401, { error: 'Unauthorized Access' });
    });
  });

  describe('GET /bookmarks', () => {
    context('Given bookmarks exist', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach(() => {
        return db.insert(testBookmarks).into('bookmarks');
      });

      it('responds 200 with bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });
  });
});
