import Time from '../src/lib/Time.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = Time.from('12:30:45')
	t.equal(d.getHours(), 12)
	t.end()
})