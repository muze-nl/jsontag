import TSONType from './lib/TSONType.mjs'
import UUID from './lib/UUID.mjs'
import Decimal from './lib/Decimal.mjs'
import Money from './lib/Money.mjs'
import TSONArray from './lib/Array.mjs'
import TSONObject from './lib/Object.mjs'
import * as attr from './lib/functions.mjs'
import parse from './lib/parse.mjs'

export default class TSON 
{

	static {
		TSON.UUID = UUID
		TSON.Decimal = Decimal
		TSON.Money = Money
		TSON.Object = TSONObject
		TSON.Array = TSONArray
		TSON.stringify = attr.stringify
		TSON.parse = parse
		TSON.getType = attr.getType
		TSON.setAttribute = attr.setAttribute
		TSON.getAttribute = attr.getAttribute
		TSON.addAttribute = attr.addAttribute
		TSON.getAttributes = attr.getAttributes
		TSON.getAttributesString = attr.getAttributesString
	}

}