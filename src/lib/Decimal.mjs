if (!String.prototype.padStart) {
	String.prototype.padStart = function padStart(targetLength,padString) {
		targetLength = targetLength>>0; //truncate if number or convert non-number to 0;
		padString = String((typeof padString !== 'undefined' ? padString : ' '));
		if (this.length > targetLength) {
			return String(this);
		}
		else {
			targetLength = targetLength-this.length;
			if (targetLength > padString.length) {
				padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
			}
			return padString.slice(0,targetLength) + String(this);
		}
	};
}

export default class Decimal {
	#i;
	#e;

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

	static from(i, e=0)
	{
		if (i instanceof Decimal) {
			return i
		}
		let oi = i
		if (typeof i === 'string') {
			if (i.indexOf('.')!==-1) {
				e = -1 * i.substring(i.indexOf('.')+1).length
			} else {
				e = 0
			}
			i = parseInt(i.replace(/[,.]/g, ''))
		}
		if (isNaN(i)) {
			throw new TypeError(oi+' is not a number')
		}
		if (isNaN(e)) {
			throw new TypeError(e+' is not a number')
		}
		return new Decimal(i, e)
	}

	toJSON()
	{
		return '"'+this.toString()+'"'
	}

	toTSON()
	{
		return '<decimal>'+this.toJSON()
	}

	toString()
	{
		let d = ''+(this.#i % Math.pow(10,-this.#e))
		return Math.floor(this.#i * Math.pow(10,this.#e)) + '.' + d.padStart(-this.#e, '0')
	}

	toExp()
	{
		return [this.#i, this.#e]
	}

	multiplyWith(n)
	{
		n = Decimal.from(n)
		let [ ni, ne ] = n.toExp()
		return new Decimal( this.#i * ni, this.#e + ne )
	}

	divideBy(n)
	{
		n = Decimal.from(n)
		let [ ni, ne ] = n.toExp()
		return new Decimal( this.#i / ni, this.#e - ne)
	}

	add(n)
	{
		n = Decimal.from(n)
		let [ ni, ne ] = n.toExp()
		console.log(''+n,ni,ne)
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
		let [ ni, ne ] = n.toExp()
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
		let [ ni, ne ] = n.toExp()
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
		console.log('nyi', e)
	}
}