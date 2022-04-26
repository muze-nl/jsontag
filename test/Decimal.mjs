import Decimal from '../src/lib/Decimal.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = Decimal.from('1.00')
	t.equal(''+d, '1.00')
	t.end()
})

tap.test('Add', t => {
	let d = Decimal.from('100.50')
	let e = Decimal.from('50.25')
	let f = d.add(e)
	t.equal(''+f, '150.75')
	t.end()
})

tap.test('Add2', t => {
	let d = Decimal.from('0.90')
	let e = Decimal.from('0.1')
	let f = d.add(e)
	t.equal(''+f, '1.00')
	t.end()
})

tap.test('Add3', t => {
	let d = Decimal.from('100.000000001')
	let e = Decimal.from('50.25')
	let f = d.add(e)
	t.equal(''+f, '150.250000001')
	t.end()
})

tap.test('Subtract', t => {
	let d = Decimal.from('10.1234')
	let e = Decimal.from('9.1234')
	let f = d.subtract(e)
	t.equal(''+f, '1.0000')
	t.end()
})

tap.test('Subtract2', t => {
	let d = Decimal.from('10.10')
	let e = Decimal.from('9.1000')
	let f = d.subtract(e)
	t.equal(''+f, '1.0000')
	t.end()
})

tap.test('Subtract3', t => {
	let d = Decimal.from('10.1000')
	let e = Decimal.from('9.10')
	let f = d.subtract(e)
	t.equal(''+f, '1.0000')
	t.end()
})

tap.test('Compare', t => {
	let d = Decimal.from('0.10')
	let e = Decimal.from('0.11')
	let f = d.compareWith(e)
	t.equal(f, -1)
	t.end()
})

tap.test('Multiply', t => {
	let d = Decimal.from('1.0000')
	let e = d.multiplyWith(5)
	t.equal(''+e, '5.0000')
	t.end()
})

tap.test('Divide', t => {
	let d = Decimal.from('6.0000')
	let e = d.divideBy(5)
	t.equal(''+e, '1.2000')
	t.end()	
})

tap.test('Round', t => {
	let d = Decimal.from('5.50')
	let e = d.round()
	t.equal(''+e, '6')
	t.end()
})

tap.test('Floor', t => {
	let d = Decimal.from('5.50')
	let e = d.floor()
	t.equal(''+e, '5')
	t.end()	
})

tap.test('Floor', t => {
	let d = Decimal.from('5.01')
	let e = d.ceil()
	t.equal(''+e, '6')
	t.end()	
})

