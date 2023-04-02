import Null from './lib/Null.mjs'
import * as attr from './lib/functions.mjs'
import parse from './lib/fast-parse.mjs'

window.JSONTag = {
	Null: Null,
	stringify: attr.stringify,
	parse: parse,
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
}