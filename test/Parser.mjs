import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

tap.test('ParseJson', t => {
	let json = `
	{
		"name":"John",
		"foo":{
			"bar":true
		}, 
		"baz": null, 
		"florb": 1.234
	}`
	let result = JSONTag.parse(json)
	t.same(result, JSON.parse(json))
	t.ok(JSONTag.isNull(result.baz))
	t.equal(JSONTag.getType(result), 'object')
	t.end()
})

tap.test('ParseNull', t => {
	let json = `<object class="Person">Nil`
	let result = JSONTag.parse(json)
	t.ok(JSONTag.isNull(result))
	t.equal(JSONTag.getType(result), 'object')
	t.ok(result instanceof JSONTag.Nil)
	t.end()
})

tap.test('ParseJSONTag', t => {
	let jsont = `
	<object class="Person">{
		"name": "John",
		"list": <array>[ 1, 2, 3 ]
	}
	`
	let result = JSONTag.parse(jsont)
	let JSONTag2 = JSONTag.stringify(result)
	t.equal(JSONTag.getType(result.list), 'array')
	t.equal(result.name, "John")
	t.equal(JSONTag.getType(result), 'object')
	t.equal(JSONTag.getTypeString(result), '<object class="Person">')
	t.end()
})

tap.test('Link', t => {
	let jsont = `{
		"foo":<object id="JSONTag1">{
			"bar":"Baz"
		},
		"bar":<link>"#JSONTag1"
	}`
	let result = JSONTag.parse(jsont)
	t.equal(result.foo, result.bar)
	t.end()
})

tap.test('Link2', t => {
	let jsont = `<object id="source">{
		"foo":<object id="JSONTag1">{
			"bar":"Baz"
		},
		"bar":<link>"#source"
	}`
/*
		"bar":<link>"/foo/"  -> json pointer
		"bar":<link>"//source" -> url - zonder protocol -> altijd https:
					".." -> illegaal, net als alle andere relatieve paden
		//FIXME: geen 'id="X"' gebruiken, maar bijv. 'refid="X"', zodat er minder verwarring 
		rondom de term id kan ontstaan
 */
	let result = JSONTag.parse(jsont)
	t.equal(result, result.bar)
	t.end()
})

tap.test('Reviver', t =>{
	let jsont = `{
		"uuid": <uuid>"9408e2c7-8f6d-4c7a-8733-6fd50b791c86"
	}`
	let result = JSONTag.parse(jsont, (key, value, meta) => {
		if (key==='uuid') {
			return new JSONTag.UUID(value)
		}
		return value;
	})
	t.ok(result.uuid instanceof JSONTag.UUID)
	t.end()
})

tap.test('Types', t => {
	let jsont = `{
		"uuid": <uuid>"9408e2c7-8f6d-4c7a-8733-6fd50b791c86",
		"time": <time>"12:30:45",
		"date": <date>"1972-09-20",
		"datetime": <datetime>"1972-09-20T12:30:45",
		"decimal": <decimal>"1.0000001",
		"money": <money>"EUR$123.99"
	}`

	let result = JSONTag.parse(jsont)
	t.equal(JSONTag.getType(result.uuid), 'uuid')
	t.equal(JSONTag.getType(result.time), 'time')
	t.equal(JSONTag.getType(result.date), 'date')
	t.equal(JSONTag.getType(result.datetime), 'datetime')
	t.equal(JSONTag.getType(result.decimal), 'decimal')
	t.equal(JSONTag.getType(result.money), 'money')
	t.end()
})