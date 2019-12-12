const express = require('express');
const bookmarkRouter = express.Router();
const uuid = require('uuid/v4');
const logger = require('./logger');
const bodyParser = express.json();
const BookmarkService = require('../BookmarkService');

bookmarkRouter.get('/bookmarks', (req, res, next) => {
  const knexInstance = req.app.get('db');
  BookmarkService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks);
    })
    .catch(next);
});

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { id } = req.params;
    BookmarkService.getBookmarkById(knexInstance, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`bookmark with id ${id} not found`);
          return res.status(404).send('Bookmark not found');
        }
        res.json(bookmark);
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { id } = req.params;
    BookmarkService.deleteBookmark(knexInstance, id)
      .then(bookmark => {
        if (bookmark === -1) {
          logger.error(`Card with id ${id} not found`);
          return res.status(404).send('Bookmark not found');
        }
        logger.info(`Bookmark with id ${id} has been deleted`);
        res.status(204).end();
      })
      .catch(next);
  });

bookmarkRouter.route('/bookmarks').post(bodyParser, (req, res, next) => {
  const { title, url, rating, description } = req.body;

  if (!title) {
    logger.error('Title is required');
    return res.status(400).send('Title required');
  }
  if (!url) {
    logger.error('Url is required');
    return res.status(400).send('Url required');
  }
  if (!rating) {
    logger.error('Rating is required');
    return res.status(400).send('Rating required');
  }

  const bookmark = {
    title,
    url,
    rating,
    description
  };

  const knexInstance = req.app.get('db');

  BookmarkService.insertBookmark(knexInstance, bookmark)
    .then(bookmark => {
      const { id } = bookmark;
      logger.info(`Bookmark with id of ${id} was created`);
      res
        .status(202)
        .location(`http://localhost:8000/bookmark/${id}`)
        .json(bookmark);
    })
    .catch(next);
});

module.exports = bookmarkRouter;
