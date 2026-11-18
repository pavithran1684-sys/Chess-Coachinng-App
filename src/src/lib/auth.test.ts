import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAuthUser, requireAuthUser } from './auth.ts'

const coach = { id: 1, role: 'coach', name: 'Test Coach', email: 'coach@test.local' }
const student = {
  id: 2,
  role: 'student',
  name: 'Test Student',
  username: 'test.student',
  institutionId: 3,
  institutionName: 'Test School',
}

test('missing and malformed account responses never expose a role', () => {
  for (const value of [undefined, null, {}, { user: coach }, { ...coach, role: 'administrator' }, 'coach']) {
    assert.equal(parseAuthUser(value), null)
    assert.throws(() => requireAuthUser(value), /incomplete account response/)
  }
})

test('valid coach and student account responses retain their server-assigned roles', () => {
  assert.deepEqual(parseAuthUser(coach), coach)
  assert.deepEqual(parseAuthUser(student), student)
  assert.deepEqual(requireAuthUser(coach), coach)
  assert.deepEqual(requireAuthUser(student), student)
})
