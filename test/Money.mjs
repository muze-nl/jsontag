import Money from '../src/lib/Money.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = Money.from('USD$1.00')
	t.equal(''+d, 'USD$1.00')
	t.end()
})

tap.test('Add', t => {
	let d = Money.from('USD$100.50')
	let e = Money.from('USD$50.25')
	let f = d.add(e)
	t.equal(''+f, 'USD$150.75')
	t.end()
})

tap.test('Add', t => {
	let d = Money.from('USD$100.000000001')
	let e = Money.from('USD$50.25')
	let f = d.add(e)
	t.equal(''+f, 'USD$150.250000001')
	t.end()
})

tap.test('Add2', t => {
	let d = Money.from('USD$0.90')
	let e = Money.from('EUR$0.1')
	t.throws(() => {
		let f = d.add(e)
	})
	t.end()
})


