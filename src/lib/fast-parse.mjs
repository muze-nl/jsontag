// non streaming handbuilt jsontag parser
import * as JSONTag from './functions.mjs'
import Null from './Null.mjs'

export default function parse(input, reviver, meta) {
	if (!meta) {
		meta = {}
	}
	if (!meta.index) {
		meta.index = new WeakMap()
	}
	if (!meta.unresolved) {
		meta.unresolved = []
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
			at: at,
			input: input
		}
	}

	let next = function(c) {
		if (c && c!==ch) {
			error("Expected '"+c+"' instead of '"+ch+"'")
		}
		ch = input.charAt(at)
		at+=1
		return ch
	}
	
	let number = function() {
		let numString = ''
		if (ch==='-') {
			numString = '-'
			next('-')
		}
		while(ch>='0' && ch<='9') {
			numString += ch
			next()
		}
		if (ch==='.') {
			numString+='.'
			while(next() && ch >= '0' && ch <= '9') {
				numString += ch
			}
		}
		if (ch === 'e' || ch === 'E') {
			numString += ch
			next()
			if (ch === '-' || ch === '+') {
				numString += ch
				next()
			}
			while (ch >= '0' && ch <= '9') {
				numString += ch
				next()
			}
		}
		return new Number(numString).valueOf()
	}
	
	let string = function() {
		let value = "", hex, i, uffff;
		if (ch !== '"') {
			error("Syntax Error")
		}
		next('"')
		while(ch) {
			if (ch==='"') {
				next()
				return value
			}
			if (ch==='\\') {
				next()
				if (ch==='u') {
					uffff=0
					for (i=0; i<4; i++) {
						hex = parseInt(next(), 16)
						if (!isFinite(hex)) {
							break
						}
						uffff = uffff * 16 + hex
					}
					value += String.fromCharCode(uffff)
					next()
				} else if (typeof escapee[ch] === 'string') {
					value += escapee[ch]
					next()
				} else {
					break
				}
			} else {
				value += ch
				next()
			}
		}
		error("Syntax error: incomplete string")
	}

	let tag = function() {
		let key, val, tagOb={
			attributes: {}
		}
		if (ch !== '<') {
			error("Syntax Error")
		}
		next('<')
		key = word()
		if (!key) {
			error('Syntax Error: expected tag name')
		}
		tagOb.tagName = key
		whitespace()
		while(ch) {
			if (ch==='>') {
				next('>')
				return tagOb
			}
			key = word()
			if (!key) {
				error('Syntax Error: expected attribute name')
			}
			whitespace()
			next('=')
			whitespace()
			val = string()
			tagOb.attributes[key] = val
			whitespace()
		}
		error('Syntax Error: unexpected end of input')
	}

	let whitespace = function() {
		while (ch) {
			switch(ch) {
				case ' ':
				case "\t":
				case "\r":
				case "\n":
					next()
				break
				default:
					return
				break
			}
		}
	}

	let word = function() {
		//[a-z][a-z0-9_]*
		let val='';
		if ((ch>='a' && ch<='z') || (ch>='A' && ch<='Z')) {
			val += ch
			next()
		} else {
			error('Syntax Error: expected word')
		}
		while((ch>='a' && ch<='z') || (ch>='A' && ch<='Z') || (ch>='0' && ch<='9') || ch=='_') {
			val += ch
			next()
		}
		return val
	}

	let boolOrNull = function() {
		let w = word()
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

	let array = function() {
		let item, array = []
		if (ch !== '[') {
			error("Syntax error")
		}
		next('[')
		whitespace()
		if (ch===']') {
			next(']')
			return array
		}
		while(ch) {
			item = value()
			if (JSONTag.getType(item)==='link') {
				meta.unresolved.push({
					src: new WeakRef(array),
					key: array.length,
					val: item
				})
			}
			array.push(item)
			whitespace()
			if (ch===']') {
				next(']')
				return array
			}
			next(',')
			whitespace()
		}
		error("Input stopped early")
	}

	let object = function() {
		let key, val, object={}
		if (ch !== '{') {
			error("Syntax Error")
		}
		next('{')
		whitespace()
		if (ch==='}') {
			next('}')
			return object
		}
		while(ch) {
			key = string()
			if (key==='__proto__') {
				error("Attempt at prototype pollution")
			}
			whitespace()
			next(':')
			val = value()
			object[key] = val
			if (JSONTag.getType(val)==='link') {
				meta.unresolved.push({
					src: new WeakRef(object),
					key: key,
					val: val
				})
			}
			whitespace()
			if (ch==='}') {
				next('}')
				return object
			}
			next(',')
			whitespace()
		}
		error("Input stopped early")
	}

	value = function() {
		let tagOb, result;
		while (typeof result === 'undefined' && ch) {
			whitespace()
			switch(ch) {
				case '{':
					result = object()
				break
				case '[':
					result = array()
				break
				case '"':
					result = string()
				break
				case '<':
					tagOb = tag()
				break
				case '-':
					result = number()
				break
				default:
					if (ch>='0' && ch<='9') {
						result = number()
					} else {
						result = boolOrNull()
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
	result = value()
	whitespace()
	if (ch) {
		error("Syntax error")
	}

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