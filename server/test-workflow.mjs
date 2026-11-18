import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApp } from './app.js'

const tempRoot = path.join(os.tmpdir(), 'opencode')
fs.mkdirSync(tempRoot, { recursive: true })
const tempDir = fs.mkdtempSync(path.join(tempRoot, 'chessdesk-workflow-'))
const { app, db, close } = createApp({
  databasePath: path.join(tempDir, 'test.db'),
  uploadDir: path.join(tempDir, 'uploads'),
  production: false,
})
const server = app.listen(0, '127.0.0.1')
await new Promise((resolve) => server.once('listening', resolve))
const address = server.address()
const baseUrl = `http://127.0.0.1:${address.port}`

class TestClient {
  cookie = ''

  async request(route, { method = 'GET', body, headers = {} } = {}) {
    const requestHeaders = new Headers(headers)
    if (this.cookie) requestHeaders.set('cookie', this.cookie)
    let requestBody = body
    if (body !== undefined && !(body instanceof FormData)) {
      requestHeaders.set('content-type', 'application/json')
      requestBody = JSON.stringify(body)
    }
    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
      redirect: 'manual',
    })
    for (const cookie of response.headers.getSetCookie()) {
      if (!cookie.startsWith('chessdesk_session=')) continue
      this.cookie = cookie.split(';')[0]
      if (this.cookie === 'chessdesk_session=') this.cookie = ''
    }
    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json') ? await response.json() : await response.text()
    return { status: response.status, body: payload, headers: response.headers }
  }

  login(role, identifier, password) {
    return this.request('/api/auth/login', { method: 'POST', body: { role, identifier, password } })
  }
}

function expectStatus(response, status, label) {
  assert.equal(response.status, status, `${label}: expected ${status}, received ${status} (${JSON.stringify(response.body)})`)
  return response.body
}

const coach = new TestClient()
const studentOne = new TestClient()
const studentTwo = new TestClient()
const outsider = new TestClient()
const anonymous = new TestClient()

try {
  expectStatus(await anonymous.request('/api/health'), 200, 'Public health check')
  const initialStatus = expectStatus(await anonymous.request('/api/auth/status'), 200, 'Empty installation status')
  assert.equal(initialStatus.coachSetupRequired, true)
  expectStatus(await anonymous.request('/api/institutions'), 401, 'Unauthenticated administration denied')
  expectStatus(await coach.request('/api/auth/setup', {
    method: 'POST', body: { name: 'Workflow Test Coach', email: 'coach@test.local', password: 'TooShort1' },
  }), 400, 'Weak initial coach password rejected')
  const setup = expectStatus(await coach.request('/api/auth/setup', {
    method: 'POST', body: { name: 'Workflow Test Coach', email: 'coach@test.local', password: 'Coach@Test123' },
  }), 201, 'First-time coach setup')
  assert.equal(setup.user.role, 'coach')
  assert.equal((await coach.request('/api/auth/me')).body.user.name, 'Workflow Test Coach')
  const storedCoach = db.prepare('SELECT * FROM coaches WHERE email = ?').get('coach@test.local')
  assert.ok(storedCoach)
  assert.notEqual(storedCoach.password_hash, 'Coach@Test123')
  assert.match(storedCoach.password_hash, /^\$2[aby]\$/)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM coaches').get().count, 1)
  assert.equal((await anonymous.request('/api/auth/status')).body.coachSetupRequired, false)
  expectStatus(await anonymous.request('/api/auth/setup', {
    method: 'POST', body: { name: 'Duplicate Coach', email: 'duplicate@test.local', password: 'Duplicate@Test123' },
  }), 409, 'Second initial setup denied')
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM coaches').get().count, 1)
  expectStatus(await coach.request('/api/auth/logout', { method: 'POST' }), 204, 'Coach logout before login tests')
  expectStatus(await coach.login('coach', 'coach@test.local', 'wrong-password'), 401, 'Incorrect coach password rejected')
  const coachLogin = expectStatus(await coach.login('coach', 'coach@test.local', 'Coach@Test123'), 200, 'Coach login')
  assert.equal(coachLogin.user.role, 'coach')
  expectStatus(await studentOne.login('student', 'missing.student', 'MissingStudent123'), 401, 'Missing student account rejected')
  console.log('✓ First-time coach setup, password hashing, duplicate prevention, and valid/invalid login passed')

  // TEST 1: Institution creation, live counts, and duplicate protection.
  const alpha = expectStatus(await coach.request('/api/institutions', {
    method: 'POST', body: { name: 'Alpha and Omega' },
  }), 201, 'TEST 1 institution creation')
  expectStatus(await coach.request('/api/institutions', {
    method: 'POST', body: { name: 'alpha AND omega' },
  }), 409, 'TEST 1 duplicate institution rejected')
  assert.equal((await coach.request('/api/dashboard')).body.totalInstitutions, 1)
  console.log('✓ TEST 1: Alpha and Omega institution created; live counts and duplicate protection work')

  // TEST 2: Two students share the institution and receive unique accounts.
  const firstPassword = 'StudentOne@123'
  const secondPassword = 'StudentTwo@123'
  const firstStudent = expectStatus(await coach.request('/api/students', {
    method: 'POST',
    body: { name: 'Aarav Sharma', age: 12, institutionId: alpha.id, schoolName: 'Alpha Junior School', password: firstPassword },
  }), 201, 'TEST 2 first student')
  const secondStudent = expectStatus(await coach.request('/api/students', {
    method: 'POST',
    body: { name: 'Diya Patel', age: 11, institutionId: alpha.id, password: secondPassword },
  }), 201, 'TEST 2 second student')
  assert.notEqual(firstStudent.username, secondStudent.username)
  assert.equal(firstStudent.institutionName, 'Alpha and Omega')
  assert.equal(secondStudent.institutionName, 'Alpha and Omega')
  expectStatus(await coach.request('/api/students', {
    method: 'POST', body: { name: 'Missing Age', institutionId: alpha.id, password: 'MissingAge@123' },
  }), 400, 'TEST 2 mandatory age validation')
  const students = expectStatus(await coach.request('/api/students'), 200, 'TEST 2 student list')
  assert.equal(students.length, 2)
  assert.equal((await coach.request('/api/dashboard')).body.totalStudents, 2)
  assert.equal((await coach.request('/api/institutions')).body[0].studentCount, 2)
  const storedFirstStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(firstStudent.id)
  assert.equal(storedFirstStudent.institution_id, alpha.id)
  assert.notEqual(storedFirstStudent.password_hash, firstPassword)
  expectStatus(await studentOne.login('student', firstStudent.username, 'incorrect-password'), 401, 'TEST 2 incorrect student password')
  const firstStudentLogin = expectStatus(await studentOne.login('student', firstStudent.username, firstPassword), 200, 'TEST 2 first student login')
  assert.equal(firstStudentLogin.user.role, 'student')
  expectStatus(await studentTwo.login('student', secondStudent.name, secondPassword), 200, 'TEST 2 name-based student login')
  console.log('✓ TEST 2: Two unique student accounts are linked to Alpha and Omega')

  // An unrelated institution/account proves institution and record isolation.
  const otherInstitution = expectStatus(await coach.request('/api/institutions', {
    method: 'POST', body: { name: 'Other School' },
  }), 201, 'Other institution setup')
  const otherStudent = expectStatus(await coach.request('/api/students', {
    method: 'POST',
    body: { name: 'Other Student', age: 13, institutionId: otherInstitution.id, password: 'OtherStudent@123' },
  }), 201, 'Other student setup')
  expectStatus(await outsider.login('student', otherStudent.username, 'OtherStudent@123'), 200, 'Other student login')

  // TEST 3: Institution-wide concept visibility and individual completion.
  const concept = expectStatus(await coach.request('/api/concepts', {
    method: 'POST',
    body: { name: 'Opening Principles', description: 'Control the centre, develop pieces, and safeguard the king.', institutionIds: [alpha.id] },
  }), 201, 'TEST 3 concept creation')
  const otherConcept = expectStatus(await coach.request('/api/concepts', {
    method: 'POST',
    body: { name: 'Other School Concept', description: 'Restricted to the unrelated institution.', institutionIds: [otherInstitution.id] },
  }), 201, 'TEST 3 unrelated concept')
  for (const [client, label] of [[studentOne, 'first'], [studentTwo, 'second']]) {
    const assigned = expectStatus(await client.request('/api/my/concepts'), 200, `TEST 3 ${label} student concepts`)
    assert.deepEqual(assigned.map((item) => item.id), [concept.id])
    assert.equal(assigned[0].completed, false)
  }
  assert.equal((await outsider.request('/api/my/concepts')).body.some((item) => item.id === concept.id), false)
  expectStatus(await studentOne.request(`/api/my/concepts/${concept.id}/completion`, {
    method: 'PUT', body: { completed: true },
  }), 200, 'TEST 3 individual completion')
  assert.equal((await studentOne.request('/api/my/concepts')).body[0].completed, true)
  assert.equal((await studentTwo.request('/api/my/concepts')).body[0].completed, false)
  const coachConcepts = expectStatus(await coach.request('/api/concepts'), 200, 'TEST 3 coach aggregate progress')
  const alphaConcept = coachConcepts.find((item) => item.id === concept.id)
  assert.equal(alphaConcept.assignedStudentCount, 2)
  assert.equal(alphaConcept.completedCount, 1)
  expectStatus(await outsider.request(`/api/my/concepts/${concept.id}/completion`, {
    method: 'PUT', body: { completed: true },
  }), 404, 'TEST 3 unrelated completion denied')
  assert.equal((await outsider.request('/api/my/concepts')).body[0].id, otherConcept.id)
  console.log('✓ TEST 3: Both Alpha and Omega students see the concept; completion and unrelated access stay isolated')

  // TEST 4: A real uploaded PDF is shared institution-wide through a protected endpoint.
  const noteForm = new FormData()
  noteForm.append('title', 'Opening Principles PDF')
  noteForm.append('description', 'Class material for the opening lesson.')
  noteForm.append('institutionId', String(alpha.id))
  noteForm.append('classDate', '2026-11-14')
  noteForm.append('file', new Blob(['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF'], { type: 'application/pdf' }), 'opening-principles.pdf')
  const note = expectStatus(await coach.request('/api/notes', { method: 'POST', body: noteForm }), 201, 'TEST 4 note upload')
  for (const [client, label] of [[studentOne, 'first'], [studentTwo, 'second']]) {
    const assigned = expectStatus(await client.request('/api/my/notes'), 200, `TEST 4 ${label} student notes`)
    assert.deepEqual(assigned.map((item) => item.id), [note.id])
    const fileResponse = await client.request(`/api/notes/${note.id}/file`)
    expectStatus(fileResponse, 200, `TEST 4 ${label} student protected file`)
    assert.match(fileResponse.body, /%PDF-1\.4/)
  }
  assert.equal((await outsider.request('/api/my/notes')).body.length, 0)
  expectStatus(await outsider.request(`/api/notes/${note.id}/file`), 404, 'TEST 4 unrelated file access denied')
  expectStatus(await anonymous.request(`/api/notes/${note.id}/file`), 401, 'TEST 4 anonymous file access denied')
  const downloadResponse = await studentTwo.request(`/api/notes/${note.id}/file?download=1`)
  expectStatus(downloadResponse, 200, 'TEST 4 file download')
  assert.match(downloadResponse.headers.get('content-disposition'), /^attachment;/)
  console.log('✓ TEST 4: Both assigned students open/download the PDF; unrelated and anonymous users cannot')

  // TEST 5: Institution-wide homework with student-specific completion.
  const homework = expectStatus(await coach.request('/api/homework', {
    method: 'POST',
    body: { title: 'Opening Exercise', instructions: 'Solve the four opening positions in your notebook.', dueDate: '2026-11-20', institutionId: alpha.id, published: true },
  }), 201, 'TEST 5 homework creation')
  for (const [client, label] of [[studentOne, 'first'], [studentTwo, 'second']]) {
    const assigned = expectStatus(await client.request('/api/my/homework'), 200, `TEST 5 ${label} student homework`)
    assert.deepEqual(assigned.map((item) => item.id), [homework.id])
  }
  assert.equal((await outsider.request('/api/my/homework')).body.length, 0)
  expectStatus(await studentOne.request(`/api/my/homework/${homework.id}/completion`, {
    method: 'PUT', body: { completed: true },
  }), 200, 'TEST 5 first student homework completion')
  assert.equal((await studentOne.request('/api/my/dashboard')).body.homeworkPending, 0)
  assert.equal((await studentTwo.request('/api/my/dashboard')).body.homeworkPending, 1)
  console.log('✓ TEST 5: Both assigned students receive homework; pending/completed counts remain personal')

  // TEST 6: Multiple real tournament records are private to the selected student.
  const firstTournament = expectStatus(await coach.request(`/api/students/${firstStudent.id}/tournaments`, {
    method: 'POST',
    body: { name: 'Inter School Open', tournamentDate: '2026-10-10', position: 8, totalRounds: 5, score: 2.5, performanceLevel: 'Average', coachRemarks: 'Steady opening play; practise endgames.' },
  }), 201, 'TEST 6 first tournament')
  const secondTournament = expectStatus(await coach.request(`/api/students/${firstStudent.id}/tournaments`, {
    method: 'POST',
    body: { name: 'City Championship', tournamentDate: '2026-11-08', position: 4, totalRounds: 6, score: 4, performanceLevel: 'Good', coachRemarks: 'Improved calculation under time pressure.' },
  }), 201, 'TEST 6 second tournament')
  expectStatus(await coach.request(`/api/students/${firstStudent.id}/tournaments`, {
    method: 'POST',
    body: { name: 'Invalid Score', tournamentDate: '2026-11-09', position: 1, totalRounds: 5, score: 6, performanceLevel: 'Excellent' },
  }), 400, 'TEST 6 score cannot exceed rounds')
  const achievements = expectStatus(await studentOne.request('/api/my/tournaments'), 200, 'TEST 6 own achievements')
  assert.deepEqual(new Set(achievements.map((item) => item.id)), new Set([firstTournament.id, secondTournament.id]))
  assert.equal((await studentTwo.request('/api/my/tournaments')).body.length, 0)
  assert.equal((await outsider.request('/api/my/tournaments')).body.length, 0)
  expectStatus(await studentTwo.request(`/api/students/${firstStudent.id}/tournaments`), 403, 'TEST 6 coach-only student profile denied')
  console.log('✓ TEST 6: Tournament history appears only in the intended student’s My Achievements')

  // TEST 7: Completion is persisted independently for institution and date.
  const alphaClass = expectStatus(await coach.request('/api/calendar', {
    method: 'POST', body: { institutionId: alpha.id, classDate: '2026-11-14' },
  }), 201, 'TEST 7 Alpha class')
  const otherClass = expectStatus(await coach.request('/api/calendar', {
    method: 'POST', body: { institutionId: otherInstitution.id, classDate: '2026-11-14' },
  }), 201, 'TEST 7 other class')
  expectStatus(await coach.request(`/api/calendar/${alphaClass.id}/completion`, {
    method: 'PUT', body: { completed: true },
  }), 200, 'TEST 7 completion update')
  const novemberClasses = expectStatus(await coach.request('/api/calendar?month=2026-11'), 200, 'TEST 7 persisted calendar')
  assert.equal(novemberClasses.find((item) => item.id === alphaClass.id).completed, true)
  assert.ok(novemberClasses.find((item) => item.id === alphaClass.id).completedAt)
  assert.equal(novemberClasses.find((item) => item.id === otherClass.id).completed, false)
  assert.equal(novemberClasses.find((item) => item.id === otherClass.id).completedAt, null)
  console.log('✓ TEST 7: Alpha and Omega is completed on 2026-11-14 while the other institution remains pending')

  // TEST 8: Server-side role, institution, and student-record privacy.
  for (const route of ['/api/dashboard', '/api/students', '/api/institutions', '/api/concepts', '/api/notes', '/api/homework', '/api/calendar?month=2026-11', '/api/coaching/profile']) {
    expectStatus(await studentOne.request(route), 403, `TEST 8 student denied ${route}`)
  }
  expectStatus(await studentOne.request('/api/institutions', {
    method: 'POST', body: { name: 'Unauthorized Institution' },
  }), 403, 'TEST 8 administrative write denied')
  expectStatus(await studentOne.request(`/api/students/${secondStudent.id}/tournaments`), 403, 'TEST 8 another student profile denied')
  expectStatus(await coach.login('coach', firstStudent.username, firstPassword), 401, 'TEST 8 student cannot use coach role')
  const mentor = expectStatus(await studentOne.request('/api/my/mentor'), 200, 'TEST 8 mentor access')
  assert.equal(mentor.name, 'Workflow Test Coach')
  console.log('✓ TEST 8: Administrative routes, cross-student records, and role escalation are denied server-side')

  // Supplemental management checks for every edit/delete workflow used by the UI.
  const temporaryInstitution = expectStatus(await coach.request('/api/institutions', {
    method: 'POST', body: { name: 'Temporary School' },
  }), 201, 'CRUD temporary institution create')
  const renamedInstitution = expectStatus(await coach.request(`/api/institutions/${temporaryInstitution.id}`, {
    method: 'PUT', body: { name: 'Temporary School Renamed' },
  }), 200, 'CRUD institution edit')
  assert.equal(renamedInstitution.name, 'Temporary School Renamed')
  expectStatus(await coach.request(`/api/institutions/${temporaryInstitution.id}`, { method: 'DELETE' }), 204, 'CRUD institution delete')
  expectStatus(await coach.request(`/api/institutions/${alpha.id}`, { method: 'DELETE' }), 409, 'CRUD assigned institution delete safeguard')

  const temporaryStudent = expectStatus(await coach.request('/api/students', {
    method: 'POST', body: { name: 'Temporary Student', age: 10, institutionId: alpha.id, password: 'Temporary@123' },
  }), 201, 'CRUD temporary student create')
  const editedStudent = expectStatus(await coach.request(`/api/students/${temporaryStudent.id}`, {
    method: 'PUT', body: { name: 'Temporary Student', age: 12, institutionId: alpha.id, schoolName: 'Updated School' },
  }), 200, 'CRUD student edit')
  assert.equal(editedStudent.age, 12)
  assert.equal(editedStudent.schoolName, 'Updated School')
  expectStatus(await coach.request(`/api/students/${temporaryStudent.id}`, { method: 'DELETE' }), 204, 'CRUD student delete')

  const temporaryConcept = expectStatus(await coach.request('/api/concepts', {
    method: 'POST', body: { name: 'Temporary Concept', description: 'Temporary description.', institutionIds: [alpha.id] },
  }), 201, 'CRUD temporary concept create')
  expectStatus(await coach.request(`/api/concepts/${temporaryConcept.id}`, {
    method: 'PUT', body: { name: 'Temporary Concept Edited', description: 'Updated concept description.', institutionIds: [alpha.id] },
  }), 200, 'CRUD concept edit')
  assert.equal((await studentTwo.request('/api/my/concepts')).body.some((item) => item.id === temporaryConcept.id && item.name === 'Temporary Concept Edited'), true)
  expectStatus(await coach.request(`/api/concepts/${temporaryConcept.id}`, { method: 'DELETE' }), 204, 'CRUD concept delete')
  assert.equal((await studentTwo.request('/api/my/concepts')).body.some((item) => item.id === temporaryConcept.id), false)

  const temporaryNoteForm = new FormData()
  temporaryNoteForm.append('title', 'Temporary Note')
  temporaryNoteForm.append('description', 'Temporary note description.')
  temporaryNoteForm.append('institutionId', String(alpha.id))
  temporaryNoteForm.append('classDate', '2026-11-15')
  temporaryNoteForm.append('file', new Blob(['Temporary class note'], { type: 'text/plain' }), 'temporary.txt')
  const temporaryNote = expectStatus(await coach.request('/api/notes', { method: 'POST', body: temporaryNoteForm }), 201, 'CRUD temporary note create')
  const temporaryNoteEditForm = new FormData()
  temporaryNoteEditForm.append('title', 'Temporary Note Edited')
  temporaryNoteEditForm.append('description', 'Updated note description without replacing the file.')
  temporaryNoteEditForm.append('institutionId', String(alpha.id))
  temporaryNoteEditForm.append('classDate', '2026-11-15')
  expectStatus(await coach.request(`/api/notes/${temporaryNote.id}`, { method: 'PUT', body: temporaryNoteEditForm }), 200, 'CRUD note edit')
  const retainedFile = await studentTwo.request(`/api/notes/${temporaryNote.id}/file`)
  expectStatus(retainedFile, 200, 'CRUD note retains file after metadata edit')
  assert.equal(retainedFile.body, 'Temporary class note')
  expectStatus(await coach.request(`/api/notes/${temporaryNote.id}`, { method: 'DELETE' }), 204, 'CRUD note delete')
  expectStatus(await coach.request(`/api/notes/${temporaryNote.id}/file`), 404, 'CRUD deleted note file inaccessible')

  const temporaryHomework = expectStatus(await coach.request('/api/homework', {
    method: 'POST', body: { title: 'Temporary Homework', instructions: 'Temporary instructions.', dueDate: '2026-11-21', institutionId: alpha.id, published: true },
  }), 201, 'CRUD temporary homework create')
  expectStatus(await coach.request(`/api/homework/${temporaryHomework.id}`, {
    method: 'PUT', body: { title: 'Temporary Homework Edited', instructions: 'Updated instructions.', dueDate: '2026-11-22', institutionId: alpha.id, published: true },
  }), 200, 'CRUD homework edit')
  assert.equal((await studentTwo.request('/api/my/homework')).body.some((item) => item.id === temporaryHomework.id && item.title === 'Temporary Homework Edited'), true)
  expectStatus(await coach.request(`/api/homework/${temporaryHomework.id}`, { method: 'DELETE' }), 204, 'CRUD homework delete')
  assert.equal((await studentTwo.request('/api/my/homework')).body.some((item) => item.id === temporaryHomework.id), false)
  expectStatus(await coach.request(`/api/calendar/${otherClass.id}`, { method: 'DELETE' }), 204, 'CRUD calendar class delete')
  assert.equal((await coach.request('/api/calendar?month=2026-11')).body.some((item) => item.id === otherClass.id), false)
  console.log('✓ Supplemental CRUD checks: institution, student, concept, note/file, homework, and calendar edit/delete workflows passed')

  // Password resets revoke existing sessions and the old credential immediately.
  const replacementPassword = 'Replacement@123'
  expectStatus(await coach.request(`/api/students/${firstStudent.id}/password`, {
    method: 'PUT', body: { password: replacementPassword },
  }), 200, 'Password reset')
  expectStatus(await studentOne.request('/api/my/dashboard'), 401, 'Existing session revoked after password reset')
  expectStatus(await studentOne.login('student', firstStudent.username, firstPassword), 401, 'Old password rejected')
  expectStatus(await studentOne.login('student', firstStudent.username, replacementPassword), 200, 'New password accepted')
  expectStatus(await studentOne.request('/api/auth/logout', { method: 'POST' }), 204, 'Student logout')
  expectStatus(await studentOne.request('/api/my/dashboard'), 401, 'Logged-out session rejected')

  console.log('\nAll 8 ChessDesk workflow/security tests passed, plus password revocation and logout checks.')
} finally {
  await new Promise((resolve) => server.close(resolve))
  close()
  fs.rmSync(tempDir, { recursive: true, force: true })
}
