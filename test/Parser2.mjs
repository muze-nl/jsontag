import JSONTag from '../src/JSONTag.mjs'
import Parser from '../src/lib/Parser.mjs'
import Null from '../src/lib/Null.mjs'
import tap from 'tap'
import fs from 'fs'

const parser = new Parser()

tap.test('ParseJson', t => {
	let json = `
{"name":"John","foo":{"bar":true},"baz":null,"florb":1.234}`
	let result = parser.parse(json)
	t.same(result, JSON.parse(json))
	t.ok(JSONTag.isNull(result.baz))
	t.equal(JSONTag.getType(result), 'object')
	t.end()
})

tap.test('ParseNull', t => {
	let json = `<object class="Person">null`
	let result = parser.parse(json)
	t.ok(JSONTag.isNull(result))
	t.equal(JSONTag.getType(result), 'object')
	t.ok(result instanceof Null)
	json = `<uint8>null`
	result = parser.parse(json)
	t.ok(JSONTag.isNull(result))
	t.equal(JSONTag.getType(result), 'uint8')
	t.end()
})

tap.test('ParseJSONTag', t => {
	let jsont = `
	<object class="Person">{
		"name": "John",
		"list": <array>[ 1, 2, 3 ]
	}
	`
	let result = parser.parse(jsont)
	let JSONTag2 = JSONTag.stringify(result)
	t.equal(JSONTag.getType(result.list), 'array')
	t.equal(result.name, "John")
	t.equal(JSONTag.getType(result), 'object')
	t.equal(JSONTag.getTypeString(result), '<object class="Person">')
	t.end()
})

tap.test('IncorrectSyntax', t => {
	let jsont = `
	<ob ject>{
		"name": "John"
	}
	`
	t.throws(() => {
		let result = parser.parse(jsont)
	})
	t.end()
})

tap.test('Link', t => {
	let jsont = `{
		"foo":<object id="JSONTag1">{
			"bar":"Baz"
		},
		"bar":<link>"JSONTag1"
	}`
	let result = parser.parse(jsont)
	t.equal(result.foo, result.bar)
	t.end()
})

tap.test('Link2', t => {
	let jsont = `<object id="source">{
		"foo":<object id="JSONTag1">{
			"bar":"Baz"
		},
		"bar":<link>"source"
	}`
	let result = parser.parse(jsont)
	t.equal(result.bar, result)
	t.end()
})

tap.test('Link3', t => {
	let jsont = `{
		"arr": [
			<link>"foo"
		],
		"foo": <object id="foo">{
			"bar":"Bar"
		}
	}`
	let result = parser.parse(jsont)
	t.equal(result.arr[0],result.foo)
	t.end()
})

tap.test('Reviver', t =>{
	let jsont = `{
		"foo": "bar",
		"date": <date>"1972-09-20"
	}`
	let result = parser.parse(jsont, (key, value, meta) => {
		if (key==='date') {
			return new Date(value)
		}
		return value;
	})
	t.ok(result.date instanceof Date)
	t.equal(result.foo, "bar")
	t.end()
})

tap.test('ReviverLink', t =>{
	let jsont = `{
		"foo": <object id="foobar">{"bar":"baz"},
		"bar": <link>"foo"
	}`
	let result = parser.parse(jsont, (key, value, meta) => {
		if (JSONTag.getType(value)==='link') {
			return new JSONTag.Link(value+'bar')
		}
		return value;
	})
	t.equal(result.bar,result.foo)
	t.end()
})

tap.test('Types', t => {
	let jsont = `{
		"uuid": <uuid>"9408e2c7-8f6d-4c7a-8733-6fd50b791c86",
		"time": <time>"12:30:45",
		"date": <date>"1972-09-20",
		"datetime": <datetime>"1972-09-20 12:30:45",
		"datetime2": <datetime>"1972-09-20T12:30:45.10Z",
		"datetime3": <datetime>"1972-09-20t12:30:45.10z",
		"datetime3": <datetime>"1972-09-20 12:30",
		"decimal": <decimal>"1.0000001",
		"money": <money>"EUR$123.99",
		"link": <link>"https://www.muze.nl/",
		"url": <url>"https://www.example.org/",
		"text": <text>"This is a longer text",
		"blob": <blob>"Should probably be base64 encoded, but hey",
		"color": <color>"hsl(360, 100%, 50%)",
		"email": <email>"auke@muze.nl",
		"hash": <hash>"Qmbq6Su7LzgYYgfQBzJUdXjgDUZZKxt4NSs4tbYwvfH8Wd",
		"phone": <phone>"+31612345678",
		"int": <int>255,
		"uint": <uint>255
	}`

	let result = parser.parse(jsont)
	result = parser.parse(jsont) // make sure no regexes have the /g flag set
	t.equal(JSONTag.getType(result.uuid), 'uuid')
	t.equal(JSONTag.getType(result.time), 'time')
	t.equal(JSONTag.getType(result.date), 'date')
	t.equal(JSONTag.getType(result.datetime), 'datetime')
	t.equal(JSONTag.getType(result.decimal), 'decimal')
	t.equal(JSONTag.getType(result.money), 'money')
	t.equal(JSONTag.getType(result.link), 'link')
	t.equal(JSONTag.getType(result.url), 'url')
	t.equal(JSONTag.getType(result.text), 'text')
	t.equal(JSONTag.getType(result.blob), 'blob')
	t.equal(JSONTag.getType(result.color), 'color')
	t.equal(JSONTag.getType(result.email), 'email')
	t.equal(JSONTag.getType(result.hash), 'hash')
	t.equal(JSONTag.getType(result.phone), 'phone')
	t.equal(JSONTag.getType(result.int), 'int')
	t.equal(JSONTag.getType(result.uint), 'uint')
	t.end()
})

tap.test('Prototype Pollution', t => {
	let jsont = `{
	"foo": "bar",
	"__proto__": {
		"admin": true
	}
}`
	let result = null
	try {
		result = parser.parse(jsont)
	} catch(e) {
		t.equal(e.message, 'Attempt at prototype pollution')
	}
	t.equal(result, null)
	t.end()

})

tap.test('Incorrect Types', t => {
	let syntaxErrors = [
		`<color>"foo"`,
		`<email>"foo"`,
		`<number>"foo"`,
		`<string>1`,
		`<object>"foo"`,
		`<array>{}`,
		`<text>false`,
		`<blob>[]`,
		`<int>"foo"`,
		`<float>[]`,
		`<color>"#foobar"`,
		`<date>"foo"`,
		`<decimal>"foo"`,
		`<int8>1024`
	]
	syntaxErrors.forEach(line => {
		let result = null
		try {
			result = parser.parse(line)
			console.log("syntax error passed: "+line)
		} catch(e) {
			// empty
		}
		t.equal(result,null)
	})
	t.end()
})

tap.test('UnresolvedIndexes', t => {
	let jsont = `{
		"bar":<object id="bar">{"baz":"baar"},
		"foo":<link>"bar",
		"foobar":<link>"bar"
	}`
	let result = parser.parse(jsont)
	t.equal(result.foo,result.bar)
	t.equal(result.foobar,result.bar)
	jsont = `{
		"bar":<object id="bar">{"baz":"baar"},
		"baz":<object id="baz">{"baz":"baar"},
		"foo":<link>"bar"
	}`
	result = parser.parse(jsont)
	t.equal(result.foo,result.bar)
	t.end()	
})

tap.test('Index', t => {
	let jsont = `{
		"bar":<object id="bar">{"baz":"baar"},
		"baz":<object id="baz">{"baz":"baar"},
		"foo":<link>"bar"
	}`
	let meta = {}
	let result = parser.parse(jsont)
	t.ok(parser.meta.index.id.has('bar'))
	t.equal(parser.meta.index.id.get('bar').deref(), result.bar)
	t.end()
})

tap.test("bool", t => {
	let jsont = `{"bool":false,"bool2":true}`
	let o = parser.parse(jsont)
	t.equal(o.bool,false)
	t.equal(o.bool2, true)
	t.end()
})

tap.test('unicode', t => {
	let jsont = `{"foo":"𠮷a"}`
	let o = parser.parse(jsont)
	t.equal(o.foo, '𠮷a')
	t.end()
})

tap.test('encoded unicode', t => {
	let jsont = `{"foo":"\\u20aca"}`
	let o = parser.parse(jsont)
	t.equal(o.foo, '€a')
	t.end()	
})

tap.test('number formats and numeric types', t => {
	let result = JSONTag.parse(`{
		"exponent": 1e3,
		"signedExponent": -1.5E-2,
		"number": <number>1e3,
		"float": <float>1e3,
		"float32": <float32>-1.5E-2,
		"float64": <float64>1.5e+2,
		"int64": <int64>-9223372036854775808,
		"uint64": <uint64>18446744073709551615
	}`)

	t.equal(result.exponent, 1000)
	t.equal(result.signedExponent, -0.015)
	t.equal(result.number.valueOf(), 1000)
	t.equal(JSONTag.getType(result.number), 'number')
	t.equal(result.float.valueOf(), 1000)
	t.equal(JSONTag.getType(result.float), 'float')
	t.equal(result.float32.valueOf(), -0.015)
	t.equal(JSONTag.getType(result.float32), 'float32')
	t.equal(result.float64.valueOf(), 150)
	t.equal(JSONTag.getType(result.float64), 'float64')
	t.equal(JSONTag.getType(result.int64), 'int64')
	t.equal(JSONTag.getType(result.uint64), 'uint64')
	t.end()
})

tap.test('string escapes', t => {
	let result = JSONTag.parse(`{
		"quote": "\\"",
		"slash": "\\\\",
		"solidus": "\\/",
		"backspace": "\\b",
		"formfeed": "\\f",
		"newline": "\\n",
		"return": "\\r",
		"tab": "\\t"
	}`)

	t.equal(result.quote, '"')
	t.equal(result.slash, '\\')
	t.equal(result.solidus, '/')
	t.equal(result.backspace, '\b')
	t.equal(result.formfeed, '\f')
	t.equal(result.newline, '\n')
	t.equal(result.return, '\r')
	t.equal(result.tab, '\t')
	t.end()
})

tap.test('empty containers and string backed types', t => {
	let result = JSONTag.parse(`{
		"object": {},
		"array": [],
		"range": <range>"[-1.5,2]",
		"relativeUrl": <url>"/profiles/john"
	}`, null, {
		baseURL: 'https://example.org/'
	})

	t.same(result.object, {})
	t.same(result.array, [])
	t.equal(result.range.valueOf(), '[-1.5,2]')
	t.equal(JSONTag.getType(result.range), 'range')
	t.equal(JSONTag.stringify(result.range), '<range>"[-1.5,2]"')
	t.equal(JSONTag.getType(result.relativeUrl), 'url')
	t.end()
})

tap.test('reviver can remove properties', t => {
	let result = JSONTag.parse(`{
		"keep": "value",
		"remove": "value",
		"nested": {
			"remove": "value"
		}
	}`, (key, value) => {
		if (key === 'remove') {
			return undefined
		}
		return value
	})

	t.same(result, {
		keep: 'value',
		nested: {}
	})
	t.end()
})

tap.test('link resolution with more indexed objects than links', t => {
	let result = JSONTag.parse(`{
		"one": <object id="one">{"name":"One"},
		"two": <object id="two">{"name":"Two"},
		"three": <object id="three">{"name":"Three"},
		"selected": <link>"two"
	}`)

	t.equal(result.selected, result.two)
	t.end()
})

tap.test('invalid numbers and ranges', t => {
	let syntaxErrors = [
		`<int>1.2`,
		`<uint>-1`,
		`<int8>-129`,
		`<uint8>256`,
		`<int64>-9223372036854775809`,
		`<uint64>18446744073709551616`,
		`<float32>3.5e+38`,
		`<float32>-3.5e+38`
	]

	syntaxErrors.forEach(line => {
		t.throws(() => JSONTag.parse(line), line)
	})
	t.end()
})

tap.test('invalid strings and urls', t => {
	let syntaxErrors = [
		`"unterminated`,
		`"invalid\\xescape"`,
		`<url>"http://["`,
		`<range>"1,2"`
	]

	syntaxErrors.forEach(line => {
		t.throws(() => JSONTag.parse(line), line)
	})
	t.end()
})

tap.test('incomplete or trailing input', t => {
	let syntaxErrors = [
		`[1,`,
		`{"a":`,
		`<object class="Person"`,
		`true false`
	]

	syntaxErrors.forEach(line => {
		t.throws(() => JSONTag.parse(line), line)
	})
	t.end()
})
