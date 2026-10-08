import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

// --- parse ---

tap.test('int64 parses to a BigInt', t => {
	const result = JSONTag.parse('[<int64>9223372036854775807, <int64>-9223372036854775808, <int64>5]')
	t.same(result.map(v => v.valueOf()), [9223372036854775807n, -9223372036854775808n, 5n])
	result.forEach(v => {
		t.ok(v instanceof BigInt)
		t.equal(JSONTag.getType(v), 'int64')
	})
	t.end()
})

tap.test('uint64 parses to a BigInt', t => {
	const result = JSONTag.parse('<uint64>18446744073709551615')
	t.equal(result.valueOf(), 18446744073709551615n)
	t.equal(JSONTag.getType(result), 'uint64')
	t.end()
})

tap.test('int64 just above 2^53 keeps its exact value', t => {
	t.equal(JSONTag.parse('<int64>9007199254740993').valueOf(), 9007199254740993n)
	t.end()
})

tap.test('int64 keeps its attributes', t => {
	const result = JSONTag.parse('<int64 class="big">5')
	t.equal(result.valueOf(), 5n)
	t.equal(JSONTag.getAttribute(result, 'class'), 'big')
	t.end()
})

tap.test('int64 and uint64 must be integers in range', t => {
	const invalid = [
		'<int64>1.5',
		'<int64>1e3',
		'<int64>-0',
		'<int64>9223372036854775808',
		'<int64>-9223372036854775809',
		'<uint64>-1',
		'<uint64>18446744073709551616'
	]
	for (const input of invalid) {
		// a parser error, not the native error from BigInt()
		t.throws(() => JSONTag.parse(input), /integer value/, input)
	}
	t.end()
})

tap.test('timestamp parses to a Number when it is a safe integer', t => {
	const result = JSONTag.parse('[<timestamp>1655729149, <timestamp>9007199254740991, <timestamp>-9007199254740991]')
	result.forEach(v => {
		t.ok(v instanceof Number)
		t.equal(JSONTag.getType(v), 'timestamp')
	})
	t.equal(result[0].valueOf(), 1655729149)
	t.equal(new Date(result[0]*1000).getUTCFullYear(), 2022)
	t.end()
})

tap.test('timestamp parses to a BigInt beyond 2^53', t => {
	const result = JSONTag.parse('[<timestamp>1728381600123456789, <timestamp>9007199254740992]')
	result.forEach(v => {
		t.ok(v instanceof BigInt)
		t.equal(JSONTag.getType(v), 'timestamp')
	})
	t.equal(result[0].valueOf(), 1728381600123456789n)
	t.end()
})

// --- stringify ---

tap.test('BigInt is written as int64', t => {
	t.equal(JSONTag.stringify(5n), '<int64>5')
	t.equal(JSONTag.stringify(-(2n**63n)), '<int64>-9223372036854775808')
	t.equal(JSONTag.stringify({ a: 1n, list: [2n] }), '{"a":<int64>1,"list":[<int64>2]}')
	t.end()
})

tap.test('BigInt above the int64 range is written as uint64', t => {
	t.equal(JSONTag.stringify(2n**63n), '<uint64>9223372036854775808')
	t.equal(JSONTag.stringify(2n**64n-1n), '<uint64>18446744073709551615')
	t.end()
})

tap.test('BigInt outside of 64 bits throws', t => {
	t.throws(() => JSONTag.stringify(2n**64n), TypeError)
	t.throws(() => JSONTag.stringify({ a: -(2n**63n)-1n }), TypeError)
	t.end()
})

tap.test('BigInt round trip', t => {
	const data = { small: 1n, big: 2n**62n, huge: 2n**64n-1n, negative: -(2n**63n) }
	const result = JSONTag.parse(JSONTag.stringify(data))
	for (const key of Object.keys(data)) {
		t.equal(result[key].valueOf(), data[key], key)
	}
	t.end()
})

tap.test('int64 and uint64 text round trip', t => {
	const jsont = '{"a":<int64>-9223372036854775808,"b":<uint64>18446744073709551615,"c":<timestamp>1728381600123456789}'
	t.equal(JSONTag.stringify(JSONTag.parse(jsont)), jsont)
	t.end()
})

tap.test('BigInt object with type and attributes', t => {
	const big = Object(5n)
	JSONTag.setType(big, 'int8')
	JSONTag.setAttribute(big, 'class', 'small')
	t.equal(JSONTag.stringify(big), '<int8 class="small">5')
	t.end()
})

tap.test('BigInt object out of range for its type throws', t => {
	const big = Object(300n)
	JSONTag.setType(big, 'int8')
	t.throws(() => JSONTag.stringify(big), TypeError)
	t.end()
})

tap.test('BigInt object as int must be a safe integer', t => {
	const safe = Object(2n**53n-1n)
	JSONTag.setType(safe, 'int')
	t.equal(JSONTag.stringify(safe), '<int>9007199254740991')
	const unsafe = Object(2n**53n)
	JSONTag.setType(unsafe, 'int')
	t.throws(() => JSONTag.stringify(unsafe), TypeError)
	t.end()
})

tap.test('replacer can return a BigInt', t => {
	t.equal(JSONTag.stringify({ a: 1 }, (key, value) => key==='a' ? 10n : value), '{"a":<int64>10}')
	t.end()
})

// --- types ---

tap.test('getType of a BigInt', t => {
	t.equal(JSONTag.getType(5n), 'int64')
	t.equal(JSONTag.getType(Object(5n)), 'int64')
	t.equal(JSONTag.getType(2n**63n), 'uint64')
	t.equal(JSONTag.getType(2n**64n), 'bigint')
	t.end()
})

tap.test('setType on a BigInt object only accepts integer types', t => {
	for (const type of ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'timestamp']) {
		t.doesNotThrow(() => JSONTag.setType(Object(1n), type), type)
	}
	for (const type of ['number', 'float', 'float64', 'string', 'object', 'date']) {
		t.throws(() => JSONTag.setType(Object(1n), type), TypeError, type)
	}
	t.end()
})

tap.test('clone a BigInt object', t => {
	const big = JSONTag.parse('<int64 class="big">9223372036854775807')
	const copy = JSONTag.clone(big)
	t.not(copy, big)
	t.ok(copy instanceof BigInt)
	t.equal(copy.valueOf(), 9223372036854775807n)
	t.equal(JSONTag.getType(copy), 'int64')
	t.equal(JSONTag.getAttribute(copy, 'class'), 'big')
	t.end()
})

tap.test('clone a Boolean object keeps its value', t => {
	t.equal(JSONTag.clone(new Boolean(false)).valueOf(), false)
	t.end()
})
