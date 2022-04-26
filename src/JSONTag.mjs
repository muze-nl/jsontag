import UUID from './lib/UUID.mjs'
import Decimal from './lib/Decimal.mjs'
import Money from './lib/Money.mjs'
import Null from './lib/Null.mjs'
import * as attr from './lib/functions.mjs'
import parse from './lib/parse.mjs'

export default class JSONTag 
{

	static {
		JSONTag.UUID = UUID
		JSONTag.Decimal = Decimal
		JSONTag.Money = Money
		JSONTag.Null = Null

		JSONTag.stringify = attr.stringify
		JSONTag.parse = parse

		JSONTag.getType = attr.getType
		JSONTag.setType = attr.setType
		JSONTag.getTypeString = attr.getTypeString
		JSONTag.setAttribute = attr.setAttribute
		JSONTag.getAttribute = attr.getAttribute
		JSONTag.addAttribute = attr.addAttribute
		JSONTag.getAttributes = attr.getAttributes
		JSONTag.setAttributes = attr.setAttributes
		JSONTag.getAttributesString = attr.getAttributesString
		
		JSONTag.isNull = attr.isNull
	}

}