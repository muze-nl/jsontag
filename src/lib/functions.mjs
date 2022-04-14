import TSONType from './TSONType.mjs'
import ohm from 'ohm-js'

export const stringify = value => {
	if (value instanceof TSONType) {
		return value.toTSON()
	} else if (Array.isArray(value)) {
		return '['+encodeEntries(value)+']'
	} else if (value instanceof Object) {
		if (typeof value.toTSON === 'function') {
			return value.toTSON()
		} else if (typeof value.toJSON === 'function') {
			return value.toJSON()
		} else {
			//@FIXME: avoid circular references
			return '{' + encodeProperties(value) + '}'
		}
	} else {
		return JSON.stringify(value)
	}
}

export const encodeProperties = obj => {
	return Object.keys(obj).map(prop => {
		return '"'+prop+'":'+stringify(obj[prop])
	}).join(',')
}

export const encodeEntries = arr => {
	return arr.map(value => {
		return stringify(value)
	}).join(',')
}

export const parse = (text) => {
	// adapted from https://github.com/jwmerrill/ohm-grammar-json/

	let tson = ohm.grammar(`
TSON {
  Start = Value

  Value = 
  	Type? 
    ( Object
    | Array
    | String
    | Number
    | True
    | False
    | Null )

  Type = 
  	"<" Name Attributes? ">"

  Name =
  	letter alnum*

  Attributes =
  	Attribute+

  Attribute =
  	Name "=" stringLiteral

  Object =
    "{" "}" -- empty
    | "{" Pair ("," Pair)* "}" -- nonEmpty

  Pair =
    String ":" Value

  Array =
    "[" "]" -- empty
    | "[" Value ("," Value)* "]" -- nonEmpty

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
  Null = "null"
}
	`)

	const actions = {
		Value: function(t, v) {
			return v.parse();
		},
		Object_empty: function (_1, _2) { return {}; },
		Object_nonEmpty: function (_1, x, _3, xs, _5) {
			var out = {};
			var k = x.children[0].parse();
			var v = x.children[2].parse();
			out[k] = v;
			for (var i = 0; i < xs.children.length; i++) {
				var c = xs.children[i];
				k = c.children[0].parse();
				v = c.children[2].parse();
				out[k] = v;
			}
			return out;
		},
		Array_empty: function (_1, _2) {
			return [];
		},
		Array_nonEmpty: function (_1, x, _3, xs, _5) {
			var out = [x.parse()];
			for (var i = 0; i < xs.children.length; i++) {
				out.push(xs.children[i].parse());
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
		True: function (e) { return true; },
		False: function (e) { return false; },
		Null: function (e) { return null; }
	}
	const match = tson.match(text);
	if (match.failed()) {
		throw new Error(match.message)
	}
	// see https://github.com/jwmerrill/ohm-grammar-json/blob/master/src/parser.js (en bijbehorende grammar)
	const semantics = tson.createSemantics()
	semantics.addOperation('parse', actions)
	const adapter = semantics(match)
	return adapter.parse()
}