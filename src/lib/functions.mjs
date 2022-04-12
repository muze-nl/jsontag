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

	let tson = ohm.grammar(`
		tson {
			value      = type? (object | array | string | number | boolean | null)
			type       = "<" name attributes? ">"
			name       = letter idchar*
  			idchar     = "_" | alnum
			attributes = attribute ( " " attribute)*
			attribute  = name "=" string
			object     = "{" members? "}"
			members    = pair ( "," pair )*
			pair       = string ":" value
			array      = "[" elements? "]"
			elements   = value ( "," value )*
			number     = int frac? exp?
			int        = "-"? (digit1_9s | digit)
			frac       = "." digits
			exp        = e digits
			digit1_9s  = "1".."9"
			digits     = digit+
			e          = ("e"|"E") ("+"|"-")?
			string     = "\\"" (char | "\\'")* "\\""
			char       = escape |  ~"\\\\" ~"\\"" ~"'" ~"\\n" any
            escape     = "\\\\\\\\" | "\\\\\\"" | "\\\\'" | "\\\\n" | "\\\\t" | useq
            useq       = "\\\\" "u" hexDigit hexDigit hexDigit hexDigit
            boolean    = "true" | "false"
            null       = "null"
		}
	`)
	return tson.match(text).succeeded()
}