import UUID from './UUID.mjs'
import Decimal from './Decimal.mjs'
import Money from './Money.mjs'
import TSONArray from './Array.mjs'
import TSONObject from './Object.mjs'

const TSONTypes = {
	UUID: UUID,
	Decimal: Decimal,
	Money: Money,
	Object: TSONObject,
	Array: TSONArray
}

export default TSONTypes
