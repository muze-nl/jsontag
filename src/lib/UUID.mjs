import { getAttributesString } from "./functions.mjs"

export default class UUID {
	#value;

	constructor(uuid)
	{
		let re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-8][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		if (!re.test(uuid)) {
			throw new TypeError(uuid+' is not a valid UUID')
		}
		this.#value = uuid
	}

	toString()
	{
		return this.#value
	}

	toJSON()
	{
		return '"'+this.#value+'"'
	}

	toJSONTag()
	{
		let attributes = getAttributesString(this)
		return '<uuid'+(attributes ? ' ' + attributes : '')+'>'+this.toJSON()
	}

}