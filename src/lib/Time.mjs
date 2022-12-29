import { getAttributesString } from "./functions.mjs"

function toISOTime(t) {
	let time     = new Date(t) 
	let hours    = '0'+time.getUTCHours()
	hours        = hours.substring(hours.length-2)
	let minutes  = '0'+time.getUTCMinutes()
	minutes      = minutes.substring(minutes.length-2)
	let seconds  = '0'+time.getUTCSeconds()
	seconds      = seconds.substring(seconds.length-2)
	let mseconds = time.getUTCMilliseconds()
	let result   = hours+':'+minutes+':'+seconds
	if (mseconds) {
		mseconds = '0'+mseconds
		mseconds = mseconds.substring(mseconds.length-2)
		result   += '.'+mseconds
	}
	return result
}

export default class Time {
	#time

	constructor(str)
	{
		let re = /^(\d\d):(\d\d):(\d\d)(\.\d\d\d)?$/
		if (re.exec(str)) {
			this.#time = new Date(Date.parse('1970-01-01T'+str+'+00:00'))
		} else {
			throw new Error(str+' is not a valid time')
		}
	}

	static from(str)
	{
		if (str instanceof Time) {
			return str
		}
		return new Time(str)
	}

	getHours()
	{
		return this.#time.getUTCHours()
	}

	getMinutes()
	{
		return this.#time.getUTCMinutes()
	}

	getSeconds()
	{
		return this.#time.getUTCSeconds()
	}

	getMilliseconds()
	{
		return this.#time.getUTCMilliseconds()
	}

	toDate()
	{
		return new Date(this.#time.getSeconds())
	}

	toString()
	{
		return getISOTime(this.#time.getTime())
	}

	toJSON()
	{
		return this.toString()
	}

	toJSONTag()
	{
		let attributes = getAttributesString(this)
		return '<time'+(attributes ? ' ' + attributes : '')+'>'+this.toJSON()
	}
}