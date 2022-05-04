import * as JSONTag from './functions.mjs'
import JSONTagTypes from './types.mjs'
import ohm from 'ohm-js'

export default function parse(text, reviver) {
	// adapted from https://github.com/jwmerrill/ohm-grammar-json/
	let refs = {}
	let unresolved = []

	let JSONT = ohm.grammar(`
JSONT {
  Start = Value

  Value =  
    ( ObjectType? Object
    | ArrayType? Array
    | StringType? String
    | UUIDType? UUID
    | NumberType? Number
    | IntType? Integer
    | FloatType? Float
    | DecimalType? Decimal
    | MoneyType? Money
    | StringyType? String
    | BooleanType? True
    | BooleanType? False
    | DateType? Date
    | TimeType? Time
    | DatetimeType? Datetime
    | Type? Nil
  ) -- nonNull
  | "null" -- bareNull

  ObjectType = 
    "<" "object" Attributes ">"

  ArrayType = 
    "<" "array" Attributes ">"

  StringType = 
    "<" "string" Attributes ">"

  UUIDType = 
    "<" "uuid" Attributes ">"

  NumberType = 
    "<" "number" Attributes ">"

  IntType = 
    "<" IntTypeName Attributes ">"

  FloatType = 
    "<" FloatTypeName Attributes ">"

  DecimalType =
  	"<" "decimal" Attributes ">"

  BooleanType = 
    "<" "boolean" Attributes ">"

  MoneyType =
    "<" "money" Attributes ">"

  DateType = 
  	"<" "date" Attributes ">"

  TimeType = 
  	"<" "time" Attributes ">"

  DatetimeType = 
  	"<" "datetime" Attributes ">"

  StringyType =
		"<" StringyTypeNames Attributes ">"

  Type = 
  	"<" TypeName Attributes ">"

  TypeName = 
    "object" | "array" | "string" | "number" | "boolean" | "decimal" | "money" | "uuid" | 
		StringyTypeNames | IntTypeName | FloatTypeName |  
    "timestamp" 

  StringyTypeNames =
    "link" | "text" | "blob" | "color" | "email" | "hash" | "interval" | "phone" | "range" | "time" | "url" 

  IntTypeName = 
		"int" | "uint" | "int8" | "uint8" | "int16" | "uint16" | "int32" |
    "uint32" | "int64" | "uint64" 

  FloatTypeName = 
    "float" | "float32" | "float64"

  Attributes =
  	Attribute*

  Attribute =
  	Name "=" stringLiteral

  Name =
  	letter alnum*

  Object =
    "{" "}" -- empty
    | "{" Pair ("," Pair)* "}" -- nonEmpty

  Pair =
    String ":" Value

  Array =
    "[" "]" -- empty
    | "[" Value ("," Value)* "]" -- nonEmpty

  UUID = "\\"" uuidLiteral "\\""

  uuidLiteral = 
 	  hex hex hex hex hex hex hex hex "-" 
		hex hex hex hex "-"
		"0".."8" hex hex hex "-"
		( "0" | "8" | "9" | "a" | "A" | "b" | "B" )
		hex hex hex "-"
		hex hex hex hex hex hex hex hex hex hex hex hex
  	
  hex = "0".."9" | "a".."f" | "A".."F"

  Money =
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

  Decimal = "\\"" decimal "\\""

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
  Nil = "Nil"

  Date = digit digit digit digit "-" digit digit "-" digit digit
  Time = digit digit ":" digit digit ":" digit digit ("." digit digit digit)?
  Datetime = Date "T" Time
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
					if (refs[reference]) {
						value = refs[reference]
					}
				}
				if (!JSONTagType.type) {
					JSONTagType.type = typeof value
				}
				if (typeof value === "string") {
					value = new String(value)
				}
				if (typeof value === "number") {
					value = new Number(value)
				}
				if (typeof value === "boolean") {
					value = new Boolean(value)
				}
				JSONTag.setType(value, JSONTagType.type)
				JSONTag.setAttributes(value, JSONTagType.attributes)
				if (JSONTagType.attributes?.id) {
					refs[JSONTagType.attributes.id] = value
				}
			}
			return value
		},
		Value_bareNull: function(v) {
			return null;
		},
		Type: parseType,
		ObjectType: parseType,
		ArrayType: parseType,
		StringyType: parseType,
		UUIDType: parseType,
		NumberType: parseType,
		IntType: parseType,
		FloatType: parseType,
		DecimalType: parseType,
		MoneyType: parseType,
		BooleanType: parseType,
		Name: function(l, a) {
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
		Number: function (e) { return parseFloat(e.source.contents); },
		UUID: function(_1, e, _2) { return e.source.contents },
		True: function (e) { return true; },
		False: function (e) { return false; },
		Nil: function (e) { return new JSONTagTypes.Nil(); }
	}
	const match = JSONT.match(text);
	if (match.failed()) {
		throw new Error(match.message)
	}
	// see https://github.com/jwmerrill/ohm-grammar-json/blob/master/src/parser.js (en bijbehorende grammar)
	const semantics = JSONT.createSemantics()
	semantics.addOperation('parse', actions)
	const adapter = semantics(match)
	let result = adapter.parse()

	unresolved.forEach((u,i) => {
		if (JSONTag.getType(u.val)==='link' && u.val[0]==='#') {
			let id = u.val.substring(1)
			if (typeof refs[id] !== 'undefined') {
				u.src[u.key] = refs[id]
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
	      return reviver.call(holder, key, value, { ids: refs, unresolved: unresolved });
    }
		return walk({"":result}, "")
	}
	return result
}