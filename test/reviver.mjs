import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

tap.test('Revive', t => {
	let j = `{
		"id": <uuid>"03d971b8-1d72-4b52-872d-21bd004d6df8",
		"name": "Joe",
		"dob": <date>"1972-09-20"
	}`
	let r = JSONTag.parse(j, JSONTag.reviver)
	t.ok(r.dob instanceof JSONTag.Date)
	t.end()
})