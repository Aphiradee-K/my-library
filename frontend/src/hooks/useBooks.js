import { useEffect, useState } from 'react'
import { load, save, uid } from '../lib/storage'

function normalise(book) {
  return {
    ...book,
    id: book.id || uid(),
    addedAt: book.addedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function useBooks(userId) {
  const [books, setBooks] = useState(() => load(`books.${userId}`, []))

  useEffect(() => {
    save(`books.${userId}`, books)
  }, [books, userId])

  const addBook = (data) => {
    const book = normalise({ ...data, id: uid(), addedAt: new Date().toISOString() })
    setBooks((current) => [book, ...current])
    return book
  }

  const updateBook = (id, patch) => {
    setBooks((current) =>
      current.map((book) =>
        book.id === id
          ? { ...book, ...patch, updatedAt: new Date().toISOString() }
          : book,
      ),
    )
  }

  const deleteBook = (id) => {
    setBooks((current) => current.filter((book) => book.id !== id))
  }

  const toggleStatus = (id) => {
    setBooks((current) =>
      current.map((book) =>
        book.id === id
          ? {
              ...book,
              status: book.status === 'owned' ? 'wishlist' : 'owned',
              updatedAt: new Date().toISOString(),
            }
          : book,
      ),
    )
  }

  return { books, addBook, updateBook, deleteBook, toggleStatus }
}
