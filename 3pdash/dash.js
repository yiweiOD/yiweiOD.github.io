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
	return (home.OVM_VALUATION - home.HEADLINE - home.CREDIT_REPAIRS_USD) / (home.OVM_VALUATION - home.HEADLINE)
}

const getValueAmount = function(home) {
	return home.OVM_VALUATION - home.HEADLINE - home.CREDIT_REPAIRS_USD
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

const drawPage = function(homes) {
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
		drawPage(activeHomes)
	}
	navDiv.appendChild(activeDiv)

	let unenrolledDiv = document.createElement('div')
	unenrolledDiv.setAttribute('class', 'unenrolledNum')
	if (homes[0].UNENROLLED_AT != null) {
		unenrolledDiv.setAttribute('class', 'unenrolledNum selected')
	}
	unenrolledDiv.innerHTML = unenrolledHomes.length + '<span>unenrolled</span>'
	unenrolledDiv.onclick = function() {
		drawPage(unenrolledHomes)
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
		"ADDRESS_TOKEN": "c9157136-eb8d-5abf-abfb-8dc220430e60",
        "ADDRESS_FULL": "3325 Claymore Dr Plano, TX 75075",
        "STREET": "3325 Claymore Dr",
        "POSTAL_CODE": "75075",
        "STATE": "TX",
        "CITY": "Plano",
        "FLIP_ID": 14567233,
        "SENT_TO_MARKETPLACE_DATE": "2023-09-21T21:44:51.742Z",
        "PHOTOGRAPHY_SCHEDULED_AT": "2023-09-25T15:30:00.000Z",
        "LIST_PRICE_SET_AT": "2023-09-25T21:47:51.745Z",
        "DAYS_ON_EO": 5,
        "TOURS_3P": 0,
        "TOURS_3P_14D": 0,
        "TRS_3P": 0,
        "TRS_3P_14D": 0,
        "FAVORITES_3P": 0,
        "FAVORITES_3P_14D": 0,
        "OFFERS_3P": 0,
        "LAST_EO_PRICE": 348300,
        "HEADLINE": 344200,
        "OVM_VALUATION": 380630.5,
        "CREDIT_REPAIRS_USD": 31969,
        "REPAIRS_BPS": 840,
        "LONGITUDE": -96.757239,
        "LATITUDE": 33.02006,
        "SELLER_BEDROOMS": 3,
        "SELLER_BATHROOMS_HALF": 0,
        "SELLER_BATHROOMS": 2,
        "SCHOOL_DISTRICT": null,
        "CONDITION_SCORE": null,
        "TOTAL_LIVING_SQ_FT": 1569,
        "UNENROLLED_AT": null
		*/

		let homeDiv = document.createElement('div')
		homeDiv.setAttribute('class', 'home')

		let homeAddrDiv = document.createElement('h2')
		homeAddrDiv.innerHTML = home.STREET
		homeDiv.appendChild(homeAddrDiv)

		let homeDescDiv = document.createElement('div')
		homeDescDiv.setAttribute('class', 'desc')
		homeDescDiv.innerHTML = home.SELLER_BEDROOMS + ' bed &bull; ' + home.SELLER_BATHROOMS + '.' + home.SELLER_BATHROOMS_HALF + ' baths &bull; '
		homeDescDiv.innerHTML += home.TOTAL_LIVING_SQ_FT + ' sq ft &bull; ' + home.CITY + ', ' + home.STATE + ' ' + home.POSTAL_CODE
		homeDiv.appendChild(homeDescDiv)

		let statsDiv = document.createElement('div')
		statsDiv.setAttribute('class', 'stats')

		let valueDiv = document.createElement('div')
		valueDiv.setAttribute('class', 'statsSec')
		valueDiv.innerHTML = '<div class="statHeader">"Value"</div>'
		valueDiv.innerHTML += '<div class="statNum">' + prettifyPercent(getValuePercent(home)) + '<span>(' + prettifyPrice(getValueAmount(home)) + ')</span></div>'
		statsDiv.appendChild(valueDiv)

		addStatSect('$ / sq ft', prettifyPrice((home.HEADLINE + 5000) / home.TOTAL_LIVING_SQ_FT), statsDiv)

		addStatSect('Headline', prettifyPrice(home.HEADLINE), statsDiv)
		addStatSect('On EO', prettifyPrice(home.LAST_EO_PRICE), statsDiv)
		addStatSect('UW', prettifyPrice(home.OVM_VALUATION), statsDiv)
		addStatSect('Repairs', prettifyPrice(home.CREDIT_REPAIRS_USD), statsDiv)
		addStatSect('RestB', prettifyNum(home.CONDITION_SCORE), statsDiv)
		
		addStatSect('Days on EO', home.DAYS_ON_EO, statsDiv)
		addStatSect('Favs', home.FAVORITES_3P, statsDiv)
		addStatSect('Tour Reqs', home.TRS_3P, statsDiv)
		addStatSect('Tours', home.TOURS_3P, statsDiv)
		addStatSect('Offers', home.OFFERS_3P, statsDiv)

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

	initMap(homes)
}

let map

async function initMap(homes) {
  const { Map } = await google.maps.importLibrary("maps")
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker")

  map = new Map(document.getElementById("map"), {
    center: { lat: 33.0, lng: -96.95 },
    zoom: 10,
    mapId: "map",
    gestureHandling: 'greedy'
  })

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

function buildContent(home) {
  const content = document.createElement("div");

  content.classList.add("marker")

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

drawPage(activeHomes)

let markers = []