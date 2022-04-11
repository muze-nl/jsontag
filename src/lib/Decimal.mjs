export default class Decimal {
	#i,#e;

	constructor(i,e)
	{
		if (isNaN(i)) {
			throw new TypeError(i+' is not a number')
		}
		if (e==0) {
			e = -2;
			i = 100 * i;
		}
		this.#i = i
		this.#e = e		
	}

	from(i, e=null)
	{
		if (i instanceof Decimal) {
			return i
		}
		let oi = i, oe = e;
		if (typeof i === 'string') {
			e = -1 * i.substring(i.indexOf('.')).length
			i = parseInt(i.replace(/[,.]/g, ''))
		} else {
			i = parseInt(i + '' + e)
			e = -1 * (''+e).length
		}
		if (isNaN(i)) {
			throw new TypeError(oi+' is not a number')
		}
		return new Decimal(i, e)
	}

	toJSON()
	{
		return '"' + Math.floor(this.#i * Math.pow(10,this.#e)) + '.' + (this.#i % Math.pow(10,-this.#e)) +'"'
	}

	toTSON()
	{
		return '<decimal>'+this.toJSON()
	}

	toExp()
	{
		return [this.#i, this.#e]
	}

	multiplyWith(n)
	{
		n = Decimal.from(n)
		let { ni, ne } = n.toExp()
		return new Decimal( this.#i * ni, this.#e + ne )
	}

	divideBy(n)
	{
		n = Decimal.from(n)
		let { ni, ne} = n.toExp()
		return new Decimal( this.#i / ni, this.#e - ne)
	}

	add(n)
	{
		n = Decimal.from(n)
		let {ni, ne} = n.toExp()
		if (ne<this.#e) {
			ni = Math.pow(10, (this.#e - ne)) * ni
			return new Decimal(this.#i + ni, this.#e)
		} else if (ne>this.#e) {
			let i = Math.pow(10, (ne - this.#e)) * this.#i
			return new Decimal(i + ni, ne)
		} else {
			return new Decimal(ni + this.#i, this.#e)
		}
	}

	subtract(n)
	{
		n = Decimal.from(n)
		let {ni, ne} = n.toExp()
		if (ne<this.#e) {
			ni = Math.pow(10, (this.#e - ne)) * ni
			return new Decimal(this.#i - ni, this.#e)
		} else if (ne>this.#e) {
			let i = Math.pow(10, (ne - this.#e)) * this.#i
			return new Decimal(i - ni, ne)
		} else {
			return new Decimal(this.#i - ni, this.#e)
		}
	}

	compareWith(n)
	{
		n = Decimal.from(n)
		let {ni,ne} = n.toExp()
		if (ne<this.#e) {
			return -1
		}
		if (ne>this.#e) {
			return 1
		}
		if (ni<this.#i) {
			return -1
		}
		if (ni>this.#i) {
			return 1
		}
		return 0
	}

	isLessThan(n)
	{
		return this.compare(n)===1
	}

	isMoreThan(n)
	{
		return this.compare(n)===-1
	}

	isEqualTo(n)
	{
		return this.compare(n)===0
	}

	toPrecision(e)
	{
		
	}
}