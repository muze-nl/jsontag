import TSONType from './lib/TSONType.mjs'
import UUID from './lib/UUID.mjs'
import Decimal from './lib/Decimal.mjs'
import Money from './lib/Money.mjs'
import TSONArray from './lib/Array.mjs'
import TSONObject from './lib/Object.mjs'
import { parse, stringify } from './lib/functions.mjs'

export default class TSON 
{

	static {
		TSON.UUID = UUID
		TSON.Decimal = Decimal
		TSON.Money = Money
		TSON.Object = TSONObject
		TSON.Array = TSONArray
		TSON.stringify = stringify
		TSON.parse = parse
	}

}