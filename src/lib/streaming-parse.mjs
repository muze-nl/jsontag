// non streaming handbuilt jsontag parser
import * as JSONTag from './functions.mjs'
import Null from './Null.mjs'

export default async function parseStream(reader, reviver, meta) {
	if (!meta) {
		meta = {}
	}
	if (!meta.index) {
		meta.index = new WeakMap()
	}
	if (!meta.unresolved) {
		meta.unresolved = []
	}

	if (typeof reader === 'string' || reader instanceof String) {
		let string = reader
		if (typeof ReadableStream === 'undefined') {
			const stream = await import('stream')
			const Readable = stream.default.Readable
			reader = Readable.from(string)
		} else {
			reader = new ReadableStream({
				start(controller) {
					controller.enqueue(string)
					controller.close()
				}
			})
			reader = reader.getReader()
		}
	}

	let at, ch, value, result;
	let escapee = {
		'"': '"',
		"\\":"\\",
		'/': '/',
		b: "\b",
		f: "\f",
		n: "\n",
		r: "\r",
		t: "\t"
	}

	let error = function(m) {
		throw {
			name: 'SyntaxError',
			message: m,
			at: at
		}
	}

	let atOffset = 0
	let chunk = ''
	let next = async function(c) {
		if (c && c!==ch) {
			error("Expected '"+c+"' instead of '"+ch+"'")
		}
		let offset = at - atOffset;
		if (!chunk || offset>chunk.length) {
			atOffset = at
			offset = 0
			let result = await reader.read()
			if (!result || result.done ) {
				error("Unexpected end of input")
				return
			}
			if (result.chunk) {
				chunk = result.chunk
			} else {
				chunk = result
			}
			console.log(at,chunk.length)
		}
		ch = chunk.charAt(offset)
		at+=1
		console.log(ch, at, chunk)
		return ch
	}
	
	let number = async function() {
		let numString = ''
		if (ch==='-') {
			numString = '-'
			await next('-')
		}
		while(ch>='0' && ch<='9') {
			numString += ch
			await next()
		}
		if (ch==='.') {
			numString+='.'
			while(await next() && ch >= '0' && ch <= '9') {
				numString += ch
			}
		}
		if (ch === 'e' || ch === 'E') {
			numString += ch
			await next()
			if (ch === '-' || ch === '+') {
				numString += ch
				await next()
			}
			while (ch >= '0' && ch <= '9') {
				numString += ch
				await next()
			}
		}
		return new Number(numString).valueOf()
	}
	
	let string = async function() {
		let value = "", hex, i, uffff;
		if (ch !== '"') {
			error("Syntax Error")
		}
		await next('"')
		while(ch) {
			if (ch==='"') {
				await next()
				return value
			}
			if (ch==='\\') {
				await next()
				if (ch==='u') {
					uffff=0
					for (i=0; i<4; i++) {
						hex = parseInt(await next(), 16)
						if (!isFinite(hex)) {
							break
						}
						uffff = uffff * 16 + hex
					}
					value += String.fromCharCode(uffff)
					await next()
				} else if (typeof escapee[ch] === 'string') {
					value += escapee[ch]
					await next()
				} else {
					break
				}
			} else {
				value += ch
				await next()
			}
		}
		error("Syntax error: incomplete string")
	}

	let tag = async function() {
		let key, val, tagOb={
			attributes: {}
		}
		if (ch !== '<') {
			error("Syntax Error")
		}
		await next('<')
		key = await word()
		if (!key) {
			error('Syntax Error: expected tag name')
		}
		tagOb.tagName = key
		await whitespace()
		while(ch) {
			if (ch==='>') {
				await next('>')
				return tagOb
			}
			key = await word()
			if (!key) {
				error('Syntax Error: expected attribute name')
			}
			await whitespace()
			await next('=')
			await whitespace()
			val = await string()
			tagOb.attributes[key] = val
			await whitespace()
		}
		error('Syntax Error: unexpected end of input')
	}

	let whitespace = async function() {
		while (ch) {
			switch(ch) {
				case ' ':
				case "\t":
				case "\r":
				case "\n":
					await next()
				break
				default:
					return
				break
			}
		}
	}

	let word = async function() {
		//[a-z][a-z0-9_]*
		let val='';
		if ((ch>='a' && ch<='z') || (ch>='A' && ch<='Z')) {
			val += ch
			await next()
		} else {
			error('Syntax Error: expected word, got: "'+ch+'"')
		}
		while((ch>='a' && ch<='z') || (ch>='A' && ch<='Z') || (ch>='0' && ch<='9') || ch=='_') {
			val += ch
			await next()
		}
		return val
	}

	let boolOrNull = async function() {
		let w = await word()
		if (!w || typeof w !== 'string') {
			error('Syntax error: expected boolean or null, got "'+w+'"')
		}
		switch(w.toLowerCase()) {
			case 'true':
				return true
			break
			case 'false':
				return false 
			break
			case 'null':
				return null
			break
			default:
				error('Syntax error: expected boolean or null, got "'+w+'"')
			break
		}
	}

	let array = async function() {
		let item, array = []
		if (ch !== '[') {
			error("Syntax error")
		}
		await next('[')
		await whitespace()
		if (ch===']') {
			await next(']')
			return array
		}
		while(ch) {
			item = await value()
			if (JSONTag.getType(item)==='link') {
				meta.unresolved.push({
					src: new WeakRef(array),
					key: array.length,
					val: item
				})
			}
			array.push(item)
			await whitespace()
			if (ch===']') {
				await next(']')
				return array
			}
			await next(',')
			await whitespace()
		}
		error("Input stopped early")
	}

	let object = async function() {
		let key, val, object={}
		if (ch !== '{') {
			error("Syntax Error")
		}
		await next('{')
		await whitespace()
		if (ch==='}') {
			await next('}')
			return object
		}
		while(ch) {
			key = await string()
			if (key==='__proto__') {
				error("Attempt at prototype pollution")
			}
			await whitespace()
			await next(':')
			val = await value()
			object[key] = val
			if (JSONTag.getType(val)==='link') {
				meta.unresolved.push({
					src: new WeakRef(object),
					key: key,
					val: val
				})
			}
			await whitespace()
			if (ch==='}') {
				await next('}')
				return object
			}
			await next(',')
			await whitespace()
		}
		error("Input stopped early")
	}

	value = async function() {
		let tagOb, result;
		while (typeof result === 'undefined' && ch) {
			await whitespace()
			switch(ch) {
				case '{':
					result = await object()
				break
				case '[':
					result = await array()
				break
				case '"':
					result = await string()
				break
				case '<':
					tagOb = await tag()
				break
				case '-':
					result = await number()
				break
				default:
					if (ch>='0' && ch<='9') {
						result = await number()
					} else {
						result = await boolOrNull()
					}
				break
			}
		}
		if (tagOb) {
			if (result === null) {
				result = new Null()
			}
			if (typeof result !== 'object') {
				switch(typeof result) {
					case 'string':
						result = new String(result)
						break
					case 'number':
						result = new Number(result)
						break
					case 'boolean':
						result = new Boolean(result)
						break
					default:
						error('Syntax Error: unexpected type '+(typeof result))
						break
				}
			}
			if (tagOb.tagName) {
				JSONTag.setType(result, tagOb.tagName)
			}
			if (tagOb.attributes) {
				JSONTag.setAttributes(result, tagOb.attributes)
				if (tagOb.attributes?.id) {
					meta.index[tagOb.attributes.id] = result
				}
			}
		}
		return result
	}

	at = 0
	ch = " "
	const main = async function() {
		result = await value()
		await whitespace()
		if (ch) {
			error("Syntax error")
		}
	}
	await main()

	meta.unresolved.forEach((u,i) => {
		if (JSONTag.getType(u.val)==='link' && u.val[0]==='#') {
			let id = u.val.substring(1)
			if (typeof meta.index[id] !== 'undefined') {
				let src = u.src.deref()
				if (src) {
					src[u.key] = meta.index[id]
				}
				delete meta.unresolved[i]
			}
		}
	})

	if (typeof reviver === 'function') {
		function walk(holder, key) {
	      var k;
	      var v;
	      var value = holder[key];
	      if (value 
	      		&& typeof value === "object" 
	      		&& !(value instanceof String 
	      		|| value instanceof Number
	      		|| value instanceof Boolean)
	      ) {
	          for (k in value) {
	              if (Object.prototype.hasOwnProperty.call(value, k)) {
	                  v = walk(value, k);
	                  if (v !== undefined) {
	                      value[k] = v;
	                  } else {
	                      delete value[k];
	                  }
	              }
	          }
	      }
	      return reviver.call(holder, key, value, meta);
	    }
		return walk({"":result}, "")
	}
	return result
}