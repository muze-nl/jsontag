import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

tap.test('Stringify', t => {
	let o = {
		'name': 'John',
		'number': 3,
		'bool': true, 
		'null': null
	}
	let result = JSONTag.stringify(o)
	t.equal(result, '{"name":"John","number":3,"bool":true,"null":null}')
	t.end()
})

tap.test('stringify keys', t => {
	const ob = {
		"\\": 'slash',
		"\n": 'enter',
		"\"": 'quote',
		"\t": 'tab',
		"€": 'unicode'
	}
	const result = JSONTag.stringify(ob)
	const expect = '{"\\\\":"slash","\\n":"enter","\\"":"quote","\\t":"tab","€":"unicode"}'
	t.same(result, expect)
	t.end()
})

tap.test('Stringify2', t => {
	let o = JSONTag.parse('<object class="Person">{"name":"John","dob":<date>"1972-09-20"}')
	let result = JSONTag.stringify(o, null, 4)
	t.equal(result, `<object class="Person">{
    "name":"John",
    "dob":<date>"1972-09-20"
}`)
	t.end()
})

tap.test('Circular', t => {
	let o = {
		foo: {
			bar: {
				name: 'Bar'
			}
		}
	}
	o.foo.bar.parent = o.foo
	let result = JSONTag.stringify(o)
	let newO = JSONTag.parse(result)
	t.same(o, newO)
	t.end()
})

tap.test('Types', t => {
 	let types = {
 		'string':'string',
 		'decimal':'10.50',
 		'money':'EUR$10.50',
 		'link':'link',
 		'text':'text',
 		'blob':'dGV4dA==',
 		'color':'hsl(255,90,90)',
 		'email':'someone@example.com',
 		'hash':'2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
 		'duration':'P15D',
 		'phone':'0031612345678',
 		'url':'https://www.example.org/',
 		'uuid':'0786f031-ffba-4dfc-92de-37dc441d5224',
 		'date':'1901-01-01',
 		'time':'12:00:30',
 		'datetime':'1970-01-01T01:00:00',
 		'int':-1025,
 		'uint':1025,
 		'int8':-128,
 		'uint8':255,
 		'int16':-32768,
 		'uint16':65535,
 		'int32':-2147483648,
 		'uint32':4294967295,
 		'int64':-9223372036854775808,
 		'uint64':18446744073709551615,
 		'float':0.1,
 		'float32':0.2,
 		'float64':0.3,
 		'timestamp':1655729149,
 		'number': 10e1,
 		'array':[1,2,3],
 		'object':{name:'John'}
 	}
 	Object.keys(types).forEach(type => {
 		t.same(
 			JSONTag.stringify(JSONTag.parse('<'+type+' class="test">'+JSON.stringify(types[type])))
 			,'<'+type+' class="test">'+JSON.stringify(types[type])
 		)
 	})
 	t.end()
})

tap.test('number object', t => {
	let data = {
		number: new Number(9)
	}
	let jsont = JSONTag.stringify(data)
	t.same(jsont, `{"number":9}`)
	t.end()
})

tap.test('Links', t => {
 	let jsont=`{
    "foo":[
        <object class="foo" id="1">{
            "name":"Foo"
        }
    ],
    "bar":[
        <object class="bar" id="2">{
            "name":"Bar",
            "children":[
                <link>"1"
            ]
        }
    ]
}`
	let o = JSONTag.parse(jsont);
	let s = JSONTag.stringify(o,null,4)
	t.equal(jsont,s)
	t.end()
 })

 tap.test('bool', t => {
 	let jsont=`{"bool":false}`
 	let o = JSONTag.parse(jsont)
 	let s = JSONTag.stringify(o)
 	t.equal(s, jsont)
 	t.end()
 })

 tap.test('links back', t => {
 	let data = [
	 	{
	 		name: 'Joe'
	 	}
 	]
 	data.push(data[0])
 	let s = JSONTag.stringify(data)
 	let o = JSONTag.parse(s)
 	t.same(o[1], data[1])
 	t.end()
 })

 tap.test('undefined', t => {
 	let data = [ undefined, { foo: undefined }]
 	let s = JSONTag.stringify(data)
 	let j = JSON.stringify(data)
 	t.same(s, j)
 	t.end()
 })

 tap.test('toJSONTag', t => {
 	class Foo {
 		toJSONTag() {
 			let result = {
 				foo: 'bar'
 			}
 			JSONTag.setAttribute(result, 'class', 'foo')
 			return result
 		}
 	}
 	let foo = new Foo()
 	foo.baz = 'baz'
 	let s = JSONTag.stringify(foo)
 	let expect = '<object class="foo">{"foo":"bar"}'
 	t.same(s, expect)
 	t.end()
 })

 tap.test('toJSON', t => {
 	class Foo {
 		toJSON() {
 			let result = {
 				foo: 'bar'
 			}
 			return result
 		}
 	}
 	let foo = new Foo()
	JSONTag.setAttribute(foo, 'class', 'foo')
 	foo.baz = 'baz'
 	let s = JSONTag.stringify(foo)
 	let expect = '<object class="foo">{"foo":"bar"}'
 	t.same(s, expect)
 	t.end()
 })