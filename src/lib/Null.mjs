import { getType, setType, getAttributes, setAttributes } from "./functions.mjs"
if (!Symbol['JSONTag:Null']) {
	Symbol['JSONTag:Null'] = Symbol('@null')
}

class ExtendableProxy {
	constructor()
	{
		return new Proxy(this,{
			get: (target,name) => {
				if (typeof target[name] !== 'undefined') {
					return target[name]
				}
				if (name == 'then' || typeof name == 'symbol' || name == 'toJSONTag') {
					return undefined
				}
				console.error('Attempting to get from Null', name, typeof name, JSON.stringify(name))
				throw new Error('Attempting to get '+name+' from Null')
			},
			set: (target,name,newValue) => {
				if (typeof name == 'symbol') {
					target[name] = newValue
					return true
				} else {
					console.error('Attempting to set '+name+' in Null to',newValue)
					throw new Error('Attempting to set '+name+' in Null')	
				}
			}
		})
	}

}

export default class Null extends ExtendableProxy {

	get [Symbol['JSONTag:Null']]() {
		return true
	}

	toString()
	{
		return ''
	}

	toJSON()
	{
		return null
	}

}