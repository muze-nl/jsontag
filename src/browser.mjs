import Null from './lib/Null.mjs'
import Link from './lib/Link.mjs'
import * as attr from './lib/functions.mjs'
import Parser from './lib/Parser.mjs'

window.JSONTag = {
	stringify: attr.stringify,
	parse: (input, reviver, meta) => {
		const P = new Parser()
		if (meta) {
			Object.assign(P.meta, meta)
		}
		return P.parse(input, reviver)
	},
	Parser,

	getType: attr.getType,
	setType: attr.setType,
	getTypeString: attr.getTypeString,

	setAttribute: attr.setAttribute,
	getAttribute: attr.getAttribute,
	addAttribute: attr.addAttribute,
	removeAttribute: attr.removeAttribute,
	getAttributes: attr.getAttributes,
	setAttributes: attr.setAttributes,
	getAttributesString: attr.getAttributesString,

	isNull: attr.isNull,
	clone: attr.clone,

	Link,
	Null
}