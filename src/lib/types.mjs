import UUID from './UUID.mjs'
import Decimal from './Decimal.mjs'
import Money from './Money.mjs'
import Null from './Null.mjs'

const JSONTagTypes = {
	UUID: UUID,
	Decimal: Decimal,
	Money: Money,
	Null: Null
}

export default JSONTagTypes
