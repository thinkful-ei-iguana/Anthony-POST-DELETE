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

  describe('GET /articles/:article_id', () => {
    context('Given an XSS attack article', () => {
      const maliciousArticle = {
        id: 911,
        title: 'test',
        url: 'https://testxss.com',
        rating: 5,
        description:
          'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
      };

      beforeEach('insert malicious article', () => {
        return db.into('bookmarks').insert([maliciousArticle]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousArticle.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(
              'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.description).to.eql(
              'Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
            );
          });
      });
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

  describe.only('POST /bookmarks', () => {
    it('creates an bookmark, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'test',
        url: 'https://testcreate.com',
        rating: 5,
        description: 'test'
      };
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body).to.have.property('id');
        })
        .then(postRes =>
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(postRes.body)
        );
    });
  });

  describe.only('DELETE /bookmarks/:bookmarkid', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(
          bookmark => bookmark.id !== idToRemove
        );
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/bookmarks')
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          );
      });
    });
  });
});
