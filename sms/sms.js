const data = datasets.filter(function (d) {
	if (d) {
		return d.queryName == "SMS v2"
	}
})[0];

let smsAll = {};
let contentDiv = document.getElementById("content");

const start = function (smsAll, div) {
	for (sms of data.content) {
		let num = sms.CUSTOMER_PHONE_NUMBER;
		if (!smsAll[num]) {
			smsAll[num] = {};

			smsAll[num].name = sms.FULL_NAME;
			if (sms.FULL_NAME.trim() == "") {
				smsAll[num].name = formatPhoneNum(sms.CUSTOMER_PHONE_NUMBER);
			}

			smsAll[num].email = sms.EMAIL;
			smsAll[num].score = sms.TARGET_BUYER_SCORE;
			smsAll[num].phone = formatPhoneNum(sms.CUSTOMER_PHONE_NUMBER);

			smsAll[num].matches = [];
			smsAll[num].matches.push(sms.FIRST_MATCH);
			smsAll[num].matches.push(sms.SECOND_MATCH);
			smsAll[num].matches.push(sms.THIRD_MATCH);

			smsAll[num].cities = parseCities(sms.CITIES);
			smsAll[num].max_price = sms.MAX_PRICE;
			smsAll[num].min_price = sms.MIN_PRICE;

			smsAll[num].bath = sms.MIN_BATHROOMS;
			smsAll[num].bed = sms.MIN_BEDROOMS;
			smsAll[num].sqft = sms.MIN_SQ_FT;

			smsAll[num].timeline = sms.BUYER_TIMELINE;
			smsAll[num].agent = sms.AGENT_STATUS;
			smsAll[num].tours = sms.HOMES_TOURED;
			smsAll[num].prequal = sms.PREQUALIFICATION_STATUS;

			smsAll[num].ourTexts = 0;
			smsAll[num].userTexts = 0;
			smsAll[num].unsubscribed = false;

			smsAll[num].texts = [];
			smsAll[num].texts.push({
				OD_NUM: sms.OPENDOOR_PHONE_NUMBER,
				BODY: parseBody(sms.BODY),
				DATE: sms.CREATED_AT,
				CUST_MSG: sms.CUSTOMER_MESSAGE,
			});
		} else {
			smsAll[num].texts.push({
				OD_NUM: sms.OPENDOOR_PHONE_NUMBER,
				BODY: parseBody(sms.BODY),
				DATE: sms.CREATED_AT,
				CUST_MSG: sms.CUSTOMER_MESSAGE,
			});
		}

		if (sms.CUSTOMER_MESSAGE) {
			smsAll[num].userTexts++;
		} else {
			smsAll[num].ourTexts++;
		}

		if (sms.BODY == 'STOP') {
			smsAll[num].unsubscribed == true
		}
	}

	drawPage(smsAll, div);
};

const formatPhoneNum = function(num) {
	let cleaned = ('' + num).replace(/\D/g, '');
	let match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
	if (match) {
		let intlCode = (match[1] ? '+1 ' : '');
		return ['(', match[2], ') ', match[3], '-', match[4]].join('');
	}
	return null;
};

const parseCities = function(cities) {
	cities = cities.replaceAll('"', '');
	cities = cities.replaceAll('[', '');
	cities = cities.replaceAll(']', '');
	let parsedCities = cities.split(',');
	return parsedCities;
};

const parseBody = function(body) {
	body = body.replaceAll('\n', '<br>');
	return body;
}

const drawPage = function (smsAll, div) {
	let navDiv = document.createElement("div");
	navDiv.setAttribute("class", "nav");
	div.appendChild(navDiv);

	let textDiv = document.createElement("div");
	textDiv.setAttribute("class", "texts");
	div.appendChild(textDiv);

	let infoDiv = document.createElement("div");
	infoDiv.setAttribute("class", "info");
	div.appendChild(infoDiv);

	for (id in smsAll) {
		let user = smsAll[id];

		let navItemDiv = document.createElement("div");
		navItemDiv.setAttribute("class", "user");
		navItemDiv.innerHTML = `
			<div class="name">${user.name}</div>
			<div class="stats">Score: ${user.score} &bull; User replies: ${user.userTexts}</div>
		`;

		navItemDiv.userId = id;
		navItemDiv.onclick = function () {
			drawTexts(this.userId, smsAll, textDiv, infoDiv);
		};
		navDiv.appendChild(navItemDiv);
	}

	drawTexts(Object.keys(smsAll)[0], smsAll, textDiv, infoDiv);
};

const drawTexts = function (id, smsAll, textDiv, infoDiv) {
	textDiv.innerHTML = "";
	let user = smsAll[id];

	for (text of user.texts) {
		if (text.CUST_MSG) {
			textDiv.innerHTML += '<div class="customer">' + text.BODY + "</div>";
		} else {
			textDiv.innerHTML += "<div>" + text.BODY + "</div>";
		}
	}

	infoDiv.innerHTML = `
		<div class="name">${user.name}</div>
		<div class="phone">${user.phone}</div>
		<div class="email">${user.email}</div>
		<div class="score">Score: ${user.score}</div>

		<div class="timeline">Timeline: ${user.timeline}</div>
		<div class="agent">Agent: ${user.agent}</div>
		<div class="tours">Tours: ${user.tours}</div>
		<div class="prequal">Pre-qual: ${user.prequal}</div>

		<div class="prefs">Preferences</div>
		<div class="beds">${user.bed} bed / ${user.bath} bath</div>
		<div class="sqft">${user.sqft} sq ft</div>
		<div class="price">$${user.min_price} - $${user.max_price}</div>
	`;

};

start(smsAll, contentDiv);
