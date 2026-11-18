import assert from 'node:assert/strict'
import test from 'node:test'
import { api, ApiError } from './api.ts'

const coach = { id: 1, role: 'coach', name: 'Test Coach', email: 'coach@test.local' }

test('canonical JSON authentication responses are preserved', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ user: coach }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
  try {
    assert.deepEqual(await api('/api/auth/login'), { user: coach })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('a static-host HTML fallback is rejected as an API transport error', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response('<!doctype html><title>ChessDesk</title>', {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
  try {
    await assert.rejects(
      () => api('/api/auth/login'),
      (error) => error instanceof ApiError && error.status === 502 && /web page instead of JSON/.test(error.message),
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
