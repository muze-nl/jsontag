import Date from '../src/lib/Date.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = Date.from('1972-09-20')
	t.equal(d.getFullYear(), 1972)
	t.end()
})