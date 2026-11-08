import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useBooks(userId) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await api.listBooks()
      setBooks(data.books)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userId) return undefined

    let cancelled = false

    api
      .listBooks()
      .then((data) => {
        if (cancelled) return
        setBooks(data.books)
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const addBook = useCallback(async (payload) => {
    const data = await api.createBook(payload)
    setBooks((current) => [data.book, ...current])
    return data.book
  }, [])

  const updateBook = useCallback(async (id, patch) => {
    const data = await api.updateBook(id, patch)
    setBooks((current) =>
      current.map((book) => (book.id === id ? data.book : book)),
    )
    return data.book
  }, [])

  const deleteBook = useCallback(async (id) => {
    await api.deleteBook(id)
    setBooks((current) => current.filter((book) => book.id !== id))
  }, [])

  const toggleStatus = useCallback(async (book) => {
    const status = book.status === 'owned' ? 'wishlist' : 'owned'
    const data = await api.updateBook(book.id, { status })
    setBooks((current) =>
      current.map((item) => (item.id === book.id ? data.book : item)),
    )
    return data.book
  }, [])

  return {
    books,
    loading,
    error,
    reload,
    addBook,
    updateBook,
    deleteBook,
    toggleStatus,
  }
}
