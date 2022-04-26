import UUID from './lib/UUID.mjs'
import Decimal from './lib/Decimal.mjs'
import Money from './lib/Money.mjs'
import Null from './lib/Null.mjs'
import * as attr from './lib/functions.mjs'
import parse from './lib/parse.mjs'

window.JSONTag = {
	UUID: UUID,
	Decimal: Decimal,
	Money: Money,
	Null: Null,
	stringify: attr.stringify,
	parse: parse,
	getType: attr.getType,
	setType: attr.setType,
	getTypeString: attr.getTypeString,
	setAttribute: attr.setAttribute,
	getAttribute: attr.getAttribute,
	addAttribute: attr.addAttribute,
	getAttributes: attr.getAttributes,
	setAttributes: attr.setAttributes,
	getAttributesString: attr.getAttributesString,
	isNull: attr.isNull
}