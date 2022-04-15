import TSON from '../src/TSON.mjs'
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
	let result = TSON.parse(json)
	t.same(result, JSON.parse(json))
	t.equal(TSON.getType(result), 'object')
	t.end()
})

tap.test('ParseTson', t => {
	let tson = `
	<Person>{
		"name": "John",
		"list": <array>[ 1, 2, 3 ]
	}
	`
	let result = TSON.parse(tson)
	console.log(result)
	t.end()
})

tap.test('Link', t => {
	let tson = `{
		"foo":<object id="tson1">{
			"bar":"Baz"
		},
		"bar":<link>"#tson1"
	}`
	let result = TSON.parse(tson)
	console.log(result)
	t.end()
})