


/*
let comps = datasets[1].content

let numComps = []
let prevAddr = ''
let count = 1

for (home of comps) {
	if (home.ADDRESS_FULL == prevAddr) {
		if (Math.abs(home.LAST_EO_PRICE - home.LIST_PRICE) < 10000) {
			count++
		}
	} else {
		numComps.push(count)
		count = 1
		prevAddr = home.ADDRESS_FULL
	}
}

let amount = 0

for (num of numComps) {
	amount += num
}

console.log(amount / numComps.length)
*/