import { getType } from './functions.mjs'
import JSONTagTypes from './types.mjs'

export default function reviver(key, value, meta)
{
	let type = getType(value)
	let alltypes = {
		uuid: 'UUID',
		link: 'Link',
		date: 'Date',
		time: 'Time',
		datetime: 'Datetime',
		decimal: 'Decimal',
		money: 'Money'
	}
	if (isNull(value)) {
		return value
	}
	if (alltypes[type]) {
		return JSONTagTypes[alltypes[type]].from(value)
	}
	return value;
}