import * as JSONTag from './functions.mjs'
import Null from './Null.mjs'
import ohm from 'ohm-js'

export let index = new Map()
export let unresolved = []

let JSONT = ohm.grammar(`
JSONT {
  Start = Value

  Value =  
  	"null" -- bareNull 
  	|(
  	  FixedType<"object">? Object
	    | FixedType<"array">? Array
	    | FixedType<"string">? String
	    | FixedType<"uuid">? UUID
	    | FixedType<"number">? Number
	    | IntType? Integer
	    | FloatType? Float
	    | FixedType<"decimal">? Decimal
	    | FixedType<"money">? Money
	    | StringyType? String
	    | FixedType<"boolean">? True
	    | FixedType<"boolean">? False
	    | FixedType<"date">? Date
	    | FixedType<"time">? Time
	    | FixedType<"datetime">? Datetime
	    | FixedType<"timestamp">? wholeNumber
	    | AnyType? Null
	  ) -- nonNull

  FixedType<type> = "<" type Attributes ">"

  IntType = 
    "<" intTypeName Attributes ">"

  FloatType = 
    "<" floatTypeName Attributes ">"

  StringyType =
		"<" stringyTypeNames Attributes ">"

  AnyType = 
  	"<" typeName Attributes ">"

  typeName = 
    "object" | "array" | "string" | "number" | "boolean" | "decimal" | "money" | "uuid" | "timestamp" |
		stringyTypeNames | intTypeName | floatTypeName 
    

  stringyTypeNames =
    "link" | "text" | "blob" | "color" | "email" | "hash" | "duration" | "phone" | "range" | "time" | "url" 

  intTypeName = 
		"int8" | "uint8" | "int16" | "uint16" | "int32" |
    "uint32" | "int64" | "uint64" | "int" | "uint" 

  floatTypeName = 
    "float32" | "float64" | "float"

  Attributes =
  	Attribute*

  Attribute =
  	name "=" stringLiteral

  name =
  	letter alnum*

  Object =
    "{" "}" -- empty
    | "{" Pair ("," Pair)* "}" -- nonEmpty

  Pair =
    String ":" Value

  Array =
    "[" "]" -- empty
    | "[" Value ("," Value)* "]" -- nonEmpty

  UUID = uuidLiteral

  uuidLiteral = "\\"" uuidLiteralContents	"\\""

  uuidLiteralContents = 
 	  hex hex hex hex hex hex hex hex "-" 
		hex hex hex hex "-"
		"0".."8" hex hex hex "-"
		( "0" | "8" | "9" | "a" | "A" | "b" | "B" )
		hex hex hex "-"
		hex hex hex hex hex hex hex hex hex hex hex hex

  hex = "0".."9" | "a".."f" | "A".."F"

  Money = moneyLiteral

  moneyLiteral = 
  	"\\"" upper* "$" decimal "\\""

  String (String) =
    stringLiteral

  stringLiteral =
    "\\"" doubleStringCharacter* "\\""

  doubleStringCharacter (character) =
    ~("\\"" | "\\\\") any -- nonEscaped
    | "\\\\" escapeSequence -- escaped

  escapeSequence =
    "\\"" -- doubleQuote
    | "\\\\" -- reverseSolidus
    | "/" -- solidus
    | "b" -- backspace
    | "f" -- formfeed
    | "n" -- newline
    | "r" -- carriageReturn
    | "t" -- horizontalTab
    | "u" fourHexDigits -- codePoint

  fourHexDigits = hexDigit hexDigit hexDigit hexDigit

  Integer = wholeNumber

  Decimal = decimalLiteral 
  decimalLiteral = "\\"" decimal "\\""

  Float = 
  	numberLiteral

  Number (Number) =
    numberLiteral

  numberLiteral =
    decimal exponent -- withExponent
    | decimal -- withoutExponent

  decimal =
    wholeNumber "." digit+ -- withFract
    | wholeNumber -- withoutFract

  wholeNumber =
    "-" unsignedWholeNumber -- negative
    | unsignedWholeNumber -- nonNegative

  unsignedWholeNumber =
    "0" -- zero
    | nonZeroDigit digit* -- nonZero

  nonZeroDigit = "1".."9"

  exponent =
    exponentMark ("+"|"-") digit+ -- signed
    | exponentMark digit+ -- unsigned

  exponentMark = "e" | "E"

  True = "true"
  False = "false"

  Date = dateLiteral 
  dateLiteral = "\\"" dateLiteralContents "\\""
  dateLiteralContents = digit digit digit digit "-" digit digit "-" digit digit

  Time = timeLiteral
  timeLiteral = "\\"" timeLiteralContents "\\"" 
  timeLiteralContents = digit digit ":" digit digit ":" digit digit ("." digit digit digit)? 

  Datetime = datetimeLiteral
  datetimeLiteral = "\\"" datetimeLiteralContents "\\""
  datetimeLiteralContents = dateLiteralContents "T" timeLiteralContents

  Null = "null"
}
`)

function parseType(_1, n, a, _2) {
	let meta = {}
	let type = n.source.contents
	if (type) {
		meta.type = type
	}
	let attributes = a.parse()
	if (attributes) {
		meta.attributes = attributes
	}
	return meta		
}

const actions = {
	Value_nonNull: function(t, v) {
		let JSONTagType = {};
		if (t.children[0]) {
			JSONTagType = t.children[0].parse()
		}
		let value = v.parse()
		if (JSONTagType?.type || JSONTagType?.attributes) {
			if (JSONTagType.type === 'link' && typeof value === 'string' && value[0]==='#') {
				let reference = value.substring(1)
				if (index[reference]) {
					value = index[reference]
					JSONTagType.type = JSONTag.getType(value)
					JSONTagType.attributes = JSONTag.getAttributes(value)
				}
			}
			if (!JSONTagType.type) {
				JSONTagType.type = typeof value
			}
			switch(typeof value) {
				case 'string':
					value = new String(value)
					break
				case 'number':
					value = new Number(value)
					break
				case 'boolean':
					value = new Boolean(value)
					break
			}
			JSONTag.setType(value, JSONTagType.type)
			JSONTag.setAttributes(value, JSONTagType.attributes)
			if (JSONTagType.attributes?.id) {
				index[JSONTagType.attributes.id] = value
			}
		}
		return value
	},
	Value_bareNull: function(v) {
		return null;
	},
	FixedType: parseType,
	AnyType: parseType,
	StringyType: parseType,
	IntType: parseType,
	FloatType: parseType,
	name: function(l, a) {
		return l.source.contents + a.children.map(c => c.source.contents).join("")
	},
	Attributes: function(a) {
		let attrs = {}
		a.children.map(c => {
			let attr = c.parse()
			attrs[attr.name] = attr.value
		})
		return attrs
	},
	Attribute: function(n, _, v) {
		let name = n.source.contents
		let value = v.parse()
		return {
			name: name,
			value: value
		}
	},
	Object_empty: function (_1, _2) { return {}; },
	Object_nonEmpty: function (_1, x, _3, xs, _5) {
		var out = {};
		var k = x.children[0].parse();
		var v = x.children[2].parse();
		out[k] = v;
		if (JSONTag.getType(v)==='link') {
			unresolved.push({
				src: out,
				key: k,
				val: v
			});
		}
		for (var i = 0; i < xs.children.length; i++) {
			var c = xs.children[i];
			k = c.children[0].parse();
			if (k==='__proto__') {
				throw new Error('Attempt at prototype pollution')
			}
			v = c.children[2].parse();
			out[k] = v;
			if (JSONTag.getType(v)==='link') {
				unresolved.push({
					src: out,
					key: k,
					val: v
				});
			}
		}
		return out;
	},
	Array_empty: function (_1, _2) {
		return [];
	},
	Array_nonEmpty: function (_1, x, _3, xs, _5) {
		var out = [x.parse()];
		// FIXME: an array with one entry somehow as xs.children.length===0
		for (var i = 0; i < xs.children.length; i++) {
			let c = xs.children[i].parse()
			out.push(c);
			if (JSONTag.getType(c)==='link') {
				unresolved.push({
					src: out,
					key: out.length-1,
					val: c
				});
			}
		}
		return out;
	},
	stringLiteral: function (_1, e, _3) {
	// TODO would it be more efficient to try to capture runs of unescaped
	// characters directly?
		return e.children.map(function (c) { return c.parse(); }).join("");
	},
	doubleStringCharacter_nonEscaped: function (e) {
		return e.source.contents;
	},
	doubleStringCharacter_escaped: function (_, e) {
		return e.parse();
	},
	escapeSequence_doubleQuote: function (e) { return '"'; },
	escapeSequence_reverseSolidus: function (e) { return '\\'; },
	escapeSequence_solidus: function (e) { return '/'; },
	escapeSequence_backspace: function (e) { return '\b'; },
	escapeSequence_formfeed: function (e) { return '\f'; },
	escapeSequence_newline: function (e) { return '\n'; },
	escapeSequence_carriageReturn: function (e) { return '\r'; },
	escapeSequence_horizontalTab: function (e) { return '\t'; },
	escapeSequence_codePoint: function (_, e) {
		return String.fromCharCode(parseInt(e.source.contents, 16));
	},
	numberLiteral: function (e) { return parseFloat(e.source.contents); },
	wholeNumber: function(e) { return parseInt(e.source.contents)},
	Integer: function(e) { return parseInt(e.source.contents) },
	uuidLiteral: function(_1, e, _2) { return e.source.contents },
	True: function (e) { return true; },
	False: function (e) { return false; },
	Null: function (e) { 
		return new Null() 
	},
	dateLiteral: function(_1, e, _2) { return e.source.contents },
	datetimeLiteral: function(_1, e, _2) { return e.source.contents },
	decimalLiteral: function(_1, e, _2) {	return e.source.contents },
	moneyLiteral: function(_1, c, _2, m, _3) { return c.source.contents+'$'+m.source.contents },
	timeLiteral: function(_1, e, _2) { return e.source.contents },
}

// see https://github.com/jwmerrill/ohm-grammar-json/blob/master/src/parser.js (en bijbehorende grammar)
const semantics = JSONT.createSemantics()
semantics.addOperation('parse', actions)


export default function parse(text, reviver) {
	// adapted from https://github.com/jwmerrill/ohm-grammar-json/

// TODO: make index and unresolved an option to pass to parse
// kept global for now, so a chunked parser approach will work with links
//	index = {}
//	unresolved = []

		const match = JSONT.match(text);
		if (match.failed()) {
			throw new Error(match.message)
		}

		const parser = semantics(match)

	let result = parser.parse()

	unresolved.forEach((u,i) => {
		if (JSONTag.getType(u.val)==='link' && u.val[0]==='#') {
			let id = u.val.substring(1)
			if (typeof index[id] !== 'undefined') {
				u.src[u.key] = index[id]
				delete unresolved[i]
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
	      return reviver.call(holder, key, value, { ids: index, unresolved: unresolved });
    }
		return walk({"":result}, "")
	}
	return result
}