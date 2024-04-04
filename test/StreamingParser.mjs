import JSONTag from '../src/JSONTag.mjs'
import Null from '../src/lib/Null.mjs'
import tap from 'tap'

/*
tap.test('ParseJson', async t => {
	let json = `
{"name":"John","foo":{"bar":true},"baz":null,"florb":1.234}`
	let result = await JSONTag.parseStream(json)
	t.same(result, JSON.parse(json))
	t.ok(JSONTag.isNull(result.baz))
	t.equal(JSONTag.getType(result), 'object')
	t.end()
})

tap.test('ParseNull', async t => {
	let json = `<object class="Person">null`
	let result = await JSONTag.parseStream(json)
	t.ok(JSONTag.isNull(result))
	t.equal(JSONTag.getType(result), 'object')
	t.ok(result instanceof Null)
	t.end()
})

tap.test('ParseJSONTag', async t => {
	let jsont = `
	<object class="Person">{
		"name": "John",
		"list": <array>[ 1, 2, 3 ]
	}
	`
	let result = await JSONTag.parseStream(jsont)
	let JSONTag2 = JSONTag.stringify(result)
	t.equal(JSONTag.getType(result.list), 'array')
	t.equal(result.name, "John")
	t.equal(JSONTag.getType(result), 'object')
	t.equal(JSONTag.getTypeString(result), '<object class="Person">')
	t.end()
})

tap.test('IncorrectSyntax', async t => {
	let jsont = `
	<ob ject>{
		"name": "John"
	}
	`
	try {
		let result = await JSONTag.parseStream(jsont)
		t.fail('Parse did not catch the syntax error')
	} catch(e) {

	}
	t.end()
})

tap.test('Link', async t => {
	let jsont = `{
		"foo":<object id="JSONTag1">{
			"bar":"Baz"
		},
		"bar":<link>"#JSONTag1"
	}`
	let result = await JSONTag.parseStream(jsont)
	t.equal(result.foo, result.bar)
	t.end()
})

tap.test('Link2', async t => {
	let jsont = `<object id="source">{
		"foo":<object id="JSONTag1">{
			"bar":"Baz"
		},
		"bar":<link>"#source"
	}`
	let result = await JSONTag.parseStream(jsont)
	t.equal(result, result.bar)
	t.end()
})

tap.test('Link3', async t => {
	let jsont = `{
		"arr": [
			<link>"#foo"
		],
		"foo": <object id="foo">{
			"bar":"Bar"
		}
	}`
	let result = await JSONTag.parseStream(jsont)
	t.equal(result.arr[0],result.foo)
	t.end()
})

tap.test('Reviver', async t =>{
	let jsont = `{
		"date": <date>"1972-09-20"
	}`
	let result = await JSONTag.parseStream(jsont, (key, value, meta) => {
		if (key==='date') {
			return new Date(value)
		}
		return value;
	})
	t.ok(result.date instanceof Date)
	t.end()
})

tap.test('Types', async t => {
	let jsont = `{
		"uuid": <uuid>"9408e2c7-8f6d-4c7a-8733-6fd50b791c86",
		"time": <time>"12:30:45",
		"date": <date>"1972-09-20",
		"datetime": <datetime>"1972-09-20T12:30:45",
		"decimal": <decimal>"1.0000001",
		"money": <money>"EUR$123.99",
		"link": <link>"https://www.muze.nl/",
		"url": <url>"https://www,example.org/",
		"text": <text>"This is a longer text",
		"blob": <blob>"Should probably be base64 encoded, but hey",
		"color": <color>"hsl(360, 100%, 50%)",
		"email": <email>"auke@muze.nl",
		"hash": <hash>"Qmbq6Su7LzgYYgfQBzJUdXjgDUZZKxt4NSs4tbYwvfH8Wd",
		"phone": <phone>"+31612345678",
		"int": <int>255,
		"uint": <uint>255
	}`

	let result = await JSONTag.parseStream(jsont)
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

tap.test('Prototype Pollution', async t => {
	let jsont = `{
	"foo": "bar",
	"__proto__": {
		"admin": true
	}
}`
	let result = null
	try {
		result = await JSONTag.parseStream(jsont)
	} catch(e) {
		t.equal(e.message, 'Attempt at prototype pollution')
	}
	t.equal(result, null)
	t.end()

})
*/