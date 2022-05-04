import UUID from './UUID.mjs'
import Decimal from './Decimal.mjs'
import Money from './Money.mjs'
import Nil from './Nil.mjs'
import Link from './Link.mjs'
import Date from './Date.mjs'
import Time from './Time.mjs'

const JSONTagTypes = {
	UUID: UUID,
	Decimal: Decimal,
	Money: Money,
	Nil: Nil,
	Link: Link,
	Date: Date,
	Time: Time
}

export default JSONTagTypes

