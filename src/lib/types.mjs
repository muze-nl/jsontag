import UUID from './UUID.mjs'
import Decimal from './Decimal.mjs'
import Money from './Money.mjs'
import Null from './Null.mjs'
import Link from './Link.mjs'
import Date from './Date.mjs'
import Time from './Time.mjs'

const JSONTagTypes = {
	UUID: UUID,
	Decimal: Decimal,
	Money: Money,
	Null: Null,
	Link: Link,
	Date: Date,
	Time: Time
}

export default JSONTagTypes

