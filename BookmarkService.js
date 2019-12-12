const BookmarkService = {
  getAllBookmarks(knex) {
    return knex('bookmarks').select('*');
  },
  getBookmarkById(knex, id) {
    return knex('bookmarks')
      .select('*')
      .where('id', id)
      .first();
  },
  insertBookmark(knex, newBookmark) {
    return knex('bookmarks')
      .insert(newBookmark)
      .returning('*')
      .then(rows => rows[0]);
  },
  deleteBookmark(knex, id) {
    return knex('bookmarks')
      .where({ id })
      .delete();
  },
  updateBookmark(knex, id, updatedData) {
    return knex('bookmarks')
      .where({ id })
      .update(updatedData);
  }
};

module.exports = BookmarkService;
