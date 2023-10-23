(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "AIzaSyAqkwgYtx6bJSDRuVgjIMSC6zeU3lMcGaE",
    v: "weekly",
    // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
    // Add other bootstrap parameters as needed, using camel case.
  });

const data = datasets.filter(function(d) {
	if (d) {
		return d.queryName == '3p homes'
	}
})[0]

const homes = data.content
const comps = datasets[1].content

const activeHomes = homes.filter(function(d) {
	if (d) {
		return d.UNENROLLED_AT == null
	}
})

const unenrolledHomes = homes.filter(function(d) {
	if (d) {
		return d.UNENROLLED_AT != null
	}
})

const adminURL = 'https://admin.opendoor.com/admin/properties?query='
const eoURL = 'https://www.opendoor.com/exclusives/homes/'
const zillowURL = 'https://www.zillow.com/homes/'
const gMapsURL = 'https://www.google.com/maps/place/'

let contentDiv = document.getElementById('content')

const prettifyPrice = function(price) {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		maximumFractionDigits: 0 // (causes 2500.99 to be printed as $2,501)
	})
	return formatter.format(price)
}

const prettifyPriceTag = function(price) {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
		maximumSignificantDigits: 3,
		notation: 'compact'
	})
	return formatter.format(price)
}

const prettifyPercent = function(number) {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 2, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		maximumFractionDigits: 2 // (causes 2500.99 to be printed as $2,501)
	})
	return formatter.format(number)
}

const prettifyNum = function(number) {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'decimal',
		minimumFractionDigits: 2, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		maximumFractionDigits: 2 // (causes 2500.99 to be printed as $2,501)
	})
	if (number == null) {
		return '--'
	}
	return formatter.format(number)
}

const prettifyNum2 = function(number) {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'decimal',
		minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
		maximumFractionDigits: 0 // (causes 2500.99 to be printed as $2,501)
	})
	if (number == null) {
		return '--'
	}
	return formatter.format(number)
}

const addDashes = function(address) {
	address.trim()
	address = address.replaceAll(',', '')
	address = address.replaceAll(' ', '-')
	address = address.replaceAll('--', '-')
	address = address.replaceAll('---', '-')
	return address
}

const getMedian = function(homes, type) {
	let amounts = []

	for (home of homes) {
		if (home[type] != null) {
			amounts.push(home[type])
		}
	}

	amounts.sort(function(a, b) {
		return parseFloat(a) - parseFloat(b)
	})

	return amounts[Math.floor(amounts.length/2)]
}

const getMean = function(homes, type) {
	let amount = 0
	let count = 0

	for (home of homes) {
		if (home[type] != null) {
			amount += parseFloat(home[type])
			count++
		}
	}

	return amount/count
}

const getValuePercent = function(home) {
	return (home.OVM_VALUATION - home.LAST_EO_PRICE - home.CREDIT_REPAIRS_USD) / (home.OVM_VALUATION - home.CREDIT_REPAIRS_USD)
}

const getValueAmount = function(home) {
	return home.OVM_VALUATION - home.LAST_EO_PRICE - home.CREDIT_REPAIRS_USD
}

const getMedianValuePercent = function(homes) {
	let amounts = []

	for (home of homes) {
		amounts.push(getValuePercent(home))
	}

	amounts.sort(function(a, b) {
		return parseFloat(a) - parseFloat(b)
	})

	return amounts[Math.floor(amounts.length/2)]
}

const getMeanValuePercent = function(homes) {
	let amount = 0
	let count = 0

	for (home of homes) {
		amount += getValuePercent(home)
		count++
	}

	return amount/count
}

const addSumStatSec = function(heading, num1, num2, parentDiv) {
	let div = document.createElement('div')
	div.setAttribute('class', 'sumStats')
	div.innerHTML = '<div class="sumHeader">' + heading + '</div>'
	div.innerHTML += '<div class="sumNum">' + num1 + '<span>Med</span></div>'
	div.innerHTML += '<div class="sumNum">' + num2 + '<span>Avg</span></div>'
	parentDiv.appendChild(div)
}

const addStatSect = function(heading, number, parentDiv) {
	let div = document.createElement('div')
	div.setAttribute('class', 'statsSec')
	div.innerHTML = '<div class="statHeader">' + heading + '</div>'
	div.innerHTML += '<div class="statNum">' + number + '</div>'
	parentDiv.appendChild(div)
}

const getAllComps = function(home) {
	home.comps = []
	home.showComps = []

	for (comp of comps) {
		if (comp.ADDRESS_FULL == home.ADDRESS_FULL &&
			Math.abs(parseInt(comp.LIST_PRICE) - parseInt(home.LAST_EO_PRICE)) < 25000 &&
			Math.abs(parseInt(comp.TOTAL_LIVING_SQ_FT) - parseInt(home.TOTAL_LIVING_SQ_FT)) < 1000) {
			home.comps.push(comp)
		}
	}
}

const getNearbyComps = function(home) {
	home.nearbyComps = home.comps.slice()
	home.nearbyComps.sort(function(x, y) {
		if (parseFloat(x.DISTANCE) < parseFloat(y.DISTANCE)) {
			return -1
		} else {
			return 1
		}
	})
}

const getPriceComps = function(home) {
	home.priceComps = home.comps.slice()
	home.priceComps.sort(function(x, y) {
		if (Math.abs(parseFloat(x.LIST_PRICE) - parseFloat(x.LAST_EO_PRICE)) <
			  Math.abs(parseFloat(y.LIST_PRICE) - parseFloat(x.LAST_EO_PRICE))) {
			return -1
		} else {
			return 1
		}
	})
}

const getSizeComps = function(home) {
	home.sizeComps = home.comps.slice()
	home.sizeComps.sort(function(x, y) {
		if (Math.abs(parseFloat(x.TOTAL_LIVING_SQ_FT) - parseFloat(home.TOTAL_LIVING_SQ_FT)) < 
			  Math.abs(parseFloat(y.TOTAL_LIVING_SQ_FT) - parseFloat(home.TOTAL_LIVING_SQ_FT))) {
			return -1
		} else {
			return 1
		}
	})
}

const getShowComps = function(home) {

	// Get the 10 closest homes
	for (let i = 0; i < 10 && i < home.nearbyComps.length; i++) {
		home.showComps.push({
			'comp': home.nearbyComps[i],
			'type': 'nearby'
		})
	}

	// Add in the 10 closest price comps
	for (let i = 0; i < 10 && i < home.priceComps.length; i++) {
		const priceComp = home.priceComps[i]
		const pos = home.showComps.findIndex(i => i.comp.MATCH_ADDRESS === priceComp.MATCH_ADDRESS)

		if (pos < 0) {
			home.showComps.push({
				'comp': priceComp,
				'type': 'price'
			})
		} else {
			home.showComps[pos].type += '-price'
		}
	}

	// Add in the 10 closest size comps
	for (let i = 0; i < 10 && i < home.sizeComps.length; i++) {
		const sizeComp = home.sizeComps[i]
		const pos = home.showComps.findIndex(i => i.comp.MATCH_ADDRESS === sizeComp.MATCH_ADDRESS)

		if (pos < 0) {
			home.showComps.push({
				'comp': sizeComp,
				'type': 'size'
			})
		} else {
			home.showComps[pos].type += '-size'
		}
	}

	// Add in the rest of the comps
	for (let i = 0; i < home.comps.length; i++) {
		const restComp = home.comps[i]
		const pos = home.showComps.findIndex(i => i.comp.MATCH_ADDRESS === restComp.MATCH_ADDRESS)

		if (pos < 0) {
			home.showComps.push({
				'comp': restComp,
				'type': 'comp'
			})
		}
	}

	console.log(home.comps.length)
	console.log(home.showComps.length)

}

const setupHomes = function(homes, comps) {
	for (home of homes) {
		getAllComps(home)
		getNearbyComps(home)
		getPriceComps(home)
		getSizeComps(home)
		getShowComps(home)
	}
}

const drawHomePage = function(home) {
	contentDiv.innerHTML = ''

	let sumDiv = document.createElement('div')
	sumDiv.setAttribute('class', 'summary')

	let navDiv = document.createElement('div')
	navDiv.setAttribute('class', 'nav')

	let backDiv = document.createElement('div')
	backDiv.setAttribute('class', 'backButton')
	backDiv.innerHTML = '< back'
	backDiv.onclick = function() {
		drawMainPage(activeHomes)
	}

	let titleDiv = document.createElement('div')
	titleDiv.setAttribute('class', 'homeStreet')
	titleDiv.innerHTML = home.STREET

	navDiv.appendChild(backDiv)
	navDiv.appendChild(titleDiv)
	sumDiv.appendChild(navDiv)
	contentDiv.appendChild(sumDiv)

	let mainDiv = document.createElement('div')
	mainDiv.setAttribute('class', 'main')

	let homesDiv = document.createElement('div')
	homesDiv.setAttribute('class', 'homes')

	homesDiv.innerHTML += `
		${home.ADDRESS_FULL}<br>
		<b>${home.LAST_EO_PRICE}</b> - ${home.SELLER_BEDROOMS} bed / ${home.SELLER_BATHROOMS}.${home.SELLER_BATHROOMS_HALF
} - ${home.TOTAL_LIVING_SQ_FT} sq ft - ${home.SCHOOL_DISTRICT}<br><br>
	`

	mainDiv.appendChild(homesDiv)

	let mapDiv = document.createElement('div')
	mapDiv.setAttribute('id', 'map')
	mainDiv.appendChild(mapDiv)

	contentDiv.appendChild(mainDiv)

	drawHomeMap(home)
}

const drawMainPage = function(homes) {
	contentDiv.innerHTML = ''

	let sumDiv = document.createElement('div')
	sumDiv.setAttribute('class', 'summary')

	let navDiv = document.createElement('div')
	navDiv.setAttribute('class', 'nav')

	let activeDiv = document.createElement('div')
	activeDiv.setAttribute('class', 'activeNum')
	if (homes[0].UNENROLLED_AT == null) {
		activeDiv.setAttribute('class', 'activeNum selected')
	}
	activeDiv.innerHTML = activeHomes.length + '<span>active</span>'
	activeDiv.onclick = function() {
		drawMainPage(activeHomes)
	}
	navDiv.appendChild(activeDiv)

	let unenrolledDiv = document.createElement('div')
	unenrolledDiv.setAttribute('class', 'unenrolledNum')
	if (homes[0].UNENROLLED_AT != null) {
		unenrolledDiv.setAttribute('class', 'unenrolledNum selected')
	}
	unenrolledDiv.innerHTML = unenrolledHomes.length + '<span>unenrolled</span>'
	unenrolledDiv.onclick = function() {
		drawMainPage(unenrolledHomes)
	}
	navDiv.appendChild(unenrolledDiv)

	sumDiv.appendChild(navDiv)

	let statsDiv = document.createElement('div')
	statsDiv.setAttribute('class', 'stats')

	addSumStatSec('"Value"', prettifyPercent(getMedianValuePercent(homes)), prettifyPercent(getMeanValuePercent(homes)), statsDiv)
	addSumStatSec('Headline', prettifyPrice(getMedian(homes, 'HEADLINE')), prettifyPrice(getMean(homes, 'HEADLINE')), statsDiv)
	addSumStatSec('On EO', prettifyPrice(getMedian(homes, 'LAST_EO_PRICE')), prettifyPrice(getMean(homes, 'LAST_EO_PRICE')), statsDiv)
	addSumStatSec('UW', prettifyPrice(getMedian(homes, 'OVM_VALUATION')), prettifyPrice(getMean(homes, 'OVM_VALUATION')), statsDiv)
	addSumStatSec('Repairs', prettifyPrice(getMedian(homes, 'CREDIT_REPAIRS_USD')), prettifyPrice(getMean(homes, 'CREDIT_REPAIRS_USD')), statsDiv)
	addSumStatSec('RestB', prettifyNum(getMedian(homes, 'CONDITION_SCORE')), prettifyNum(getMean(homes, 'CONDITION_SCORE')), statsDiv)

	sumDiv.appendChild(statsDiv)

	contentDiv.appendChild(sumDiv)

	let mainDiv = document.createElement('div')
	mainDiv.setAttribute('class', 'main')

	let homesDiv = document.createElement('div')
	homesDiv.setAttribute('class', 'homes')

	for (home of homes) {
		/*
		ADDRESS_FULL: "3808 Hunters Trl Carrollton, TX 75007"
		ADDRESS_TOKEN: "16edaab7-ab57-57c0-814a-e7e26b9b26c4"
		CITY: "Carrollton"
		CONDITION_SCORE: null
		CREDIT_REPAIRS_USD: 20882.2
		DAYS_ON_EO: 4
		FAVORITES_3P: 0
		FAVORITES_3P_14D: 0
		FLIP_ID: 14799522
		HEADLINE: 530200
		LAST_EO_PRICE: 534500
		LATITUDE: 33.013931
		LIST_PRICE_SET_AT: "2023-10-20T22: 24: 05.780Z"
		LONGITUDE: -96.914219
		OFFERS_3P: 0
		OVM_VALUATION: 582832.58
		PDP_VIEWS: 1
		PHOTOGRAPHY_SCHEDULED_AT: null
		POSTAL_CODE: "75007"
		REPAIRS_BPS: 358
		SCHOOL_DISTRICT: null
		SELLER_BATHROOMS: 3
		SELLER_BATHROOMS_HALF: 0
		SELLER_BEDROOMS: 5
		SENT_TO_MARKETPLACE_DATE: "2023-10-19T15: 55: 19.179Z"
		STATE: "TX"
		STREET: "3808 Hunters Trl"
		TOTAL_LIVING_SQ_FT: 3368
		TOURS_3P: 0
		TOURS_3P_14D: 0
		TRS_3P: 0
		TRS_3P_14D: 0
		UNENROLLED_AT: null
		*/

		let homeDiv = document.createElement('div')
		homeDiv.setAttribute('class', 'home')

		let homeAddrDiv = document.createElement('h2')
		homeAddrDiv.innerHTML = home.STREET
		homeDiv.appendChild(homeAddrDiv)

		homeAddrDiv.home = home

		homeAddrDiv.onclick = function(e) {
			drawHomePage(this.home)
		}

		let homeDescDiv = document.createElement('div')
		homeDescDiv.setAttribute('class', 'desc')
		homeDescDiv.innerHTML = home.SELLER_BEDROOMS + ' bed &bull; ' + home.SELLER_BATHROOMS + '.' + home.SELLER_BATHROOMS_HALF + ' baths &bull; '
		homeDescDiv.innerHTML += home.TOTAL_LIVING_SQ_FT + ' sq ft &bull; ' + home.CITY + ', ' + home.STATE + ' ' + home.POSTAL_CODE
		homeDiv.appendChild(homeDescDiv)

		let statsDiv = document.createElement('div')
		statsDiv.setAttribute('class', 'stats')

		let statsTopDiv = document.createElement('div')
		statsTopDiv.setAttribute('class', 'statsTop')
		statsDiv.appendChild(statsTopDiv)

		let statsPriceDiv = document.createElement('div')
		statsPriceDiv.setAttribute('class', 'statsPrice')
		statsDiv.appendChild(statsPriceDiv)

		let statsEngDiv = document.createElement('div')
		statsEngDiv.setAttribute('class', 'statsEng')
		statsDiv.appendChild(statsEngDiv)

		addStatSect('"Value" %', prettifyPercent(getValuePercent(home)), statsTopDiv)
		addStatSect('"Value" $', prettifyPrice(getValueAmount(home)), statsTopDiv)
		addStatSect('# comps', prettifyNum2(home.showComps.length), statsTopDiv)
		addStatSect('$ / sq ft', prettifyPrice(home.LAST_EO_PRICE / home.TOTAL_LIVING_SQ_FT), statsTopDiv)
		addStatSect('RestB', prettifyNum(home.CONDITION_SCORE), statsTopDiv)

		addStatSect('MOP', prettifyPrice(home.LAST_EO_PRICE), statsPriceDiv)
		addStatSect('UW - R', prettifyPrice(home.OVM_VALUATION - home.CREDIT_REPAIRS_USD), statsPriceDiv)
		addStatSect('Headline', prettifyPrice(home.HEADLINE), statsPriceDiv)
		addStatSect('UW', prettifyPrice(home.OVM_VALUATION), statsPriceDiv)
		addStatSect('Repairs', prettifyPrice(home.CREDIT_REPAIRS_USD), statsPriceDiv)
		
		addStatSect('Days on EO', home.DAYS_ON_EO, statsEngDiv)
		addStatSect('PDP Views', home.PDP_VIEWS, statsEngDiv)
		addStatSect('Favs', home.FAVORITES_3P, statsEngDiv)
		addStatSect('Tour Reqs', home.TRS_3P, statsEngDiv)
		addStatSect('Tours', home.TOURS_3P, statsEngDiv)
		addStatSect('Offers', home.OFFERS_3P, statsEngDiv)

		homeDiv.appendChild(statsDiv)

		let homeLinksDiv = document.createElement('div')
		homeLinksDiv.setAttribute('class', 'links')
		homeLinksDiv.innerHTML = '<a href="' + adminURL + home.ADDRESS_TOKEN + '" target="_blank">Admin</a> &bull; ' +
			'<a href="' + eoURL + addDashes(home.ADDRESS_FULL) + '" target="_blank">Exclusives</a> &bull; ' +
			'<a href="' + zillowURL + addDashes(home.ADDRESS_FULL) + '" target="_blank">Zillow</a> &bull; ' +
			'<a href="' + gMapsURL + encodeURIComponent(home.ADDRESS_FULL) + '" target="_blank">Google Maps</a>'
		homeDiv.appendChild(homeLinksDiv)

		homesDiv.appendChild(homeDiv)
	}

	mainDiv.appendChild(homesDiv)

	let mapDiv = document.createElement('div')
	mapDiv.setAttribute('id', 'map')
	mainDiv.appendChild(mapDiv)

	contentDiv.appendChild(mainDiv)

	drawMainMap(homes)
}

let map

async function drawMainMap(homes) {
  const { Map } = await google.maps.importLibrary("maps")
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker")

  map = new Map(document.getElementById("map"), {
    center: { lat: 33.0, lng: -96.95 },
    zoom: 10,
    mapId: "map",
    gestureHandling: 'greedy'
  })

  markers = []

  for (home of homes) {
  	const marker = new AdvancedMarkerElement({
			map,
			position: { lat: home.LATITUDE, lng: home.LONGITUDE },
			content: buildContent(home)
		})

  	marker.addListener("click", () => {
      toggleHighlight(marker, home)
    })

  	if (marker) {
  		markers.push(marker)
  	}
  }
}

async function drawHomeMap(home) {
  const { Map } = await google.maps.importLibrary("maps")
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker")

  map = new Map(document.getElementById("map"), {
    center: { lat: home.LATITUDE, lng: home.LONGITUDE },
    zoom: 11,
    mapId: "map",
    gestureHandling: 'greedy'
  })

  markers = []

  for (let i = 0; i < home.showComps.length; i++) {
  	const comp = home.showComps[i].comp
  	const type = home.showComps[i].type

  	const marker = new AdvancedMarkerElement({
			map,
			position: { lat: comp.COMP_LATITUDE, lng: comp.COMP_LONGITUDE },
			content: buildCompContent(comp, type)
		})

  	marker.addListener("click", () => {
      toggleHighlight(marker, comp)
    })

  	if (marker) {
  		markers.push(marker)
  	}
  }

  const marker = new AdvancedMarkerElement({
		map,
		position: { lat: home.LATITUDE, lng: home.LONGITUDE },
		content: buildContent(home, 'currentHome')
	})

	marker.addListener("click", () => {
    toggleHighlight(marker, home)
  })

	if (marker) {
		markers.push(marker)
	}
}

function toggleHighlight(markerView, home) {

	for (marker of markers) {
		if (marker != markerView) {
			marker.content.classList.remove("highlight")
			marker.zIndex = null
		}
	}

	if (markerView.content.classList.contains("highlight")) {
		markerView.content.classList.remove("highlight")
		markerView.zIndex = null
	} else {
		markerView.content.classList.add("highlight")
		markerView.zIndex = 1
	}
}

function buildContent(home, type) {
  const content = document.createElement("div")

  content.classList.add("marker")
  if (type == 'currentHome') {
  	content.classList.add("currentHome")
  }
  
  content.innerHTML = `
    <div class="marker-price">${prettifyPriceTag(home.LAST_EO_PRICE)}</div>
    <div class="marker-details">
        <div class="price">${prettifyPrice(home.LAST_EO_PRICE)}</div>
        <div class="address">${home.ADDRESS_FULL}</div>
        <div class="features">
        	${home.SELLER_BEDROOMS} bed &bull; ${home.SELLER_BATHROOMS}.${home.SELLER_BATHROOMS_HALF} bath &bull; ${home.TOTAL_LIVING_SQ_FT} sq ft
		</div>
    </div>
    `;
  return content
}

function buildCompContent(home, type) {
  const content = document.createElement("div")

  content.classList.add("marker")
  
  content.innerHTML = `
    <div class="marker-price">${prettifyPriceTag(home.LIST_PRICE)}</div>
    <div class="marker-details">
        <div class="price">${prettifyPrice(home.LIST_PRICE)}</div>
        <div class="address">${home.MATCH_ADDRESS}</div>
        <div class="features">
        	${home.SELLER_BEDROOMS} bed &bull; ${home.SELLER_BATHROOMS} bath &bull; ${home.TOTAL_LIVING_SQ_FT} sq ft
		</div>
    </div>
    `;
  return content
}

setupHomes(homes, comps)
drawMainPage(activeHomes)

let markers = []