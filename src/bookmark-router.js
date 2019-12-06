const express = require('express');
const bookmarkRouter = express.Router();
const bookmarks = require('./bookmarks');
const uuid = require('uuid/v4');
const logger = require('./logger');
const bodyParser = express.json();

bookmarkRouter.route('/bookmarks').get((req, res) => {
  res.json(bookmarks);
});

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bookmark => bookmark.id == id);
    console.log(bookmark);

    if (!bookmark) {
      logger.error(`bookmark with id ${id} not found`);
      return res.status(404).send('Bookmark not found');
    }
    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Card with id ${id} not found`);
      return res.status(404).send('Bookmark not found');
    }

    const newBookmarks = bookmarks.filter(bookmark => {
      bookmark.id !== id;
    });
    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} has been deleted`);
    res.status(204).end();
  });

bookmarkRouter.route('/bookmark').post(bodyParser, (req, res) => {
  const { title, url, rating, desc } = req.body;

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

  const id = uuid();

  const bookmark = {
    id,
    title,
    url,
    rating,
    desc
  };

  bookmarks.push(bookmark);
  logger.info(`Bookmark with id ${id} was created`);
  res
    .status(202)
    .location(`http://localhost:8000/bookmark/${id}`)
    .json(bookmark);
});

module.exports = bookmarkRouter;
