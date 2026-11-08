function toUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}

function toBook(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    category: row.category,
    status: row.status,
    rating: row.rating,
    pages: row.pages,
    year: row.year,
    notes: row.notes,
    cover: row.cover,
    addedAt: row.added_at,
    updatedAt: row.updated_at,
  }
}

function toActivity(row) {
  return {
    id: row.id,
    type: row.type,
    device: row.device,
    at: row.created_at,
  }
}

module.exports = { toUser, toBook, toActivity }
