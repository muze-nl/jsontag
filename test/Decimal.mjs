import Decimal from '../src/lib/Decimal.mjs'
import tap from 'tap'

tap.test('Create', (t) => {
	let d = Decimal.from('1.00')
	t.equal(''+d, '1.00')
	t.end()
})

tap.test('Add', (t) => {
	let d = Decimal.from('100.50')
	let e = Decimal.from('50.25')
	let f = d.add(e)
	t.equal(''+f, '150.75')
	t.end()
})