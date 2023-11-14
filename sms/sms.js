const data = datasets.filter(function (d) {
	if (d) {
		return d.queryName == "SMS v2"
	}
})[0];

let contentDiv = document.getElementById('content');

const start = function (data, div) {
	let smsAll = {};

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

			smsAll[num].matches.push({
				date: sms.FIRST_MATCH_DATE,
				address: sms.FIRST_MATCH,
				clicked: sms.FIRST_MATCH_CLICKED,
				reply: sms.FIRST_MATCH_REPLY
			});

			smsAll[num].matches.push({
				date: sms.SECOND_MATCH_DATE,
				address: sms.SECOND_MATCH,
				clicked: sms.SECOND_MATCH_CLICKED,
				reply: sms.SECOND_MATCH_REPLY
			});

			smsAll[num].matches.push({
				date: sms.THIRD_MATCH_DATE,
				address: sms.THIRD_MATCH,
				clicked: sms.THIRD_MATCH_CLICKED,
				reply: sms.THIRD_MATCH_REPLY
			});

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
			smsAll[num].lastTextRelTime = "";

			smsAll[num].texts = [];
			smsAll[num].texts.push({
				OD_NUM: sms.OPENDOOR_PHONE_NUMBER,
				BODY: parseBody(sms.BODY),
				DATE: sms.CREATED_AT,
				CUST_MSG: sms.CUSTOMER_MESSAGE,
			});

			smsAll[num].textExp = 'old';
			smsAll[num].firstTextTime = new Date(sms.CREATED_AT);

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

		if (sms.BODY.toLowerCase() == 'stop') {
			smsAll[num].unsubscribed = true
		}

		let expText = 'search through our 400';
		if (sms.BODY.indexOf(expText) > 0) {
			smsAll[num].textExp = 'new';
		}

		smsAll[num].lastTextRelTime = relTime(sms.CREATED_AT);
		smsAll[num].lastTextTime = new Date(sms.CREATED_AT);

	}

	let sortedUsers = [];
	for (id in smsAll) {
		let user = smsAll[id];
		sortedUsers.push({
			id: id,
			lastTextTime: user.lastTextTime
		});
	}

	sortedUsers.sort(function(x, y) {
		if (x.lastTextTime > y.lastTextTime) {
			return -1
		} else {
			return 1
		}
	});

	drawPage(smsAll, div, sortedUsers);

	runTextExpAnalytics(smsAll, sortedUsers);
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
};

const relTime = function(time) {
	let textTime = new Date(time);
	let now = new Date();

	let delta = Math.round((now - textTime) / 1000);
	let relTime = "";

	const minute = 60,
		hour = minute * 60,
		day = hour * 24,
		week = day * 7;

	if (delta < minute) {
		relTime = delta + ' seconds ago';
	} else if (delta < 2 * minute) {
		relTime = 'A minute ago'
	} else if (delta < hour) {
		relTime = Math.floor(delta / minute) + ' minutes ago';
	} else if (Math.floor(delta / hour) == 1) {
		relTime = '1 hour ago.'
	} else if (delta < day) {
		relTime = Math.floor(delta / hour) + ' hours ago';
	} else if (delta < day * 2) {
		relTime = 'Yesterday';
	} else if (delta < week) {
		relTime = Math.floor(delta / day) + ' days ago'
	} else {
		relTime = 'Over a week ago'
	}

	return relTime;
};

const parseDate = function(time) {
	let textTime = new Date(time);
	return textTime.toLocaleDateString() + ' ' + textTime.toLocaleTimeString();
};

const drawPage = function (smsAll, div, sortedUsers) {

	let navDiv = document.createElement("div");
	navDiv.setAttribute("class", "nav");
	div.appendChild(navDiv);

	let textDiv = document.createElement("div");
	textDiv.setAttribute("class", "texts");
	div.appendChild(textDiv);

	let infoDiv = document.createElement("div");
	infoDiv.setAttribute("class", "info");
	div.appendChild(infoDiv);

	for (sortedUser of sortedUsers) {
		let user = smsAll[sortedUser.id];

		let navItemDiv = document.createElement("div");
		navItemDiv.setAttribute("class", "user");
		navItemDiv.setAttribute("id", "id" + sortedUser.id);
		navItemDiv.innerHTML = `
			<div class="name">${user.name}</div>
			<div class="stats">Score: ${user.score} &bull; User replies: ${user.userTexts}</div>
			<div class="updated">${user.lastTextRelTime}</div>
		`;

		if (user.userTexts > 0) {
			navItemDiv.setAttribute("class", "user replied");
		}

		if (user.unsubscribed) {
			navItemDiv.setAttribute("class", "user unsubscribed");
		}

		navItemDiv.userId = sortedUser.id;
		navItemDiv.prevClass = navItemDiv.className;

		navItemDiv.onclick = function () {
			drawTexts(this.userId, smsAll, textDiv, infoDiv);
		};
		navDiv.appendChild(navItemDiv);
	}

	drawTexts(sortedUsers[0].id, smsAll, textDiv, infoDiv);
};

const drawTexts = function (id, smsAll, textDiv, infoDiv) {
	let user = smsAll[id];
	let userDiv = document.getElementById('id' + id);
	let prevUserDiv = document.getElementsByClassName('active');

	if (prevUserDiv[0]) {
		prevUserDiv[0].setAttribute('class', prevUserDiv[0].prevClass);
	}
	userDiv.setAttribute('class', 'user active');

	textDiv.innerHTML = "";

	for (text of user.texts) {
		if (text.CUST_MSG) {
			textDiv.innerHTML += '<div class="customer text">' + text.BODY + '<div class="time">' + parseDate(text.DATE) + '</div></div>';
		} else {
			textDiv.innerHTML += '<div class="text">' + text.BODY + '<div class="time">' + parseDate(text.DATE) + '</div></div>';
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

	textDiv.scrollTop = textDiv.scrollHeight;

};

const runTextExpAnalytics = function(smsAll, sortedUsers) {
	let numUsersOld = 0,
		numUsersNew = 0,
		numFirstMatchOld = 0,
		numFirstMatchNew = 0,
		numFirstMatchClickedOld = 0,
		numFirstMatchClickedNew = 0,
		numFirstMatchRepliedOld = 0,
		numFirstMatchRepliedNew = 0,
		numFirstMatchTimetoOld = 0,
		numFirstMatchTimetoNew = 0,
		numSecondMatchOld = 0,
		numSecondMatchNew = 0,
		numSecondMatchClickedOld = 0,
		numSecondMatchClickedNew = 0,
		numSecondMatchRepliedOld = 0,
		numSecondMatchRepliedNew = 0,
		numSecondMatchTimetoOld = 0,
		numSecondMatchTimetoNew = 0,
		numThirdMatchOld = 0,
		numThirdMatchNew = 0,
		numThirdMatchClickedOld = 0,
		numThirdMatchClickedNew = 0,
		numThirdMatchRepliedOld = 0,
		numThirdMatchRepliedNew = 0,
		numThirdMatchTimetoOld = 0,
		numThirdMatchTimetoNew = 0;

	for (sortedUser of sortedUsers) {
		let user = smsAll[sortedUser.id];	

		if (user.textExp == 'old') {
			numUsersOld++;

			if (user.matches[0].address) {
				numFirstMatchOld++;
				if (user.matches[0].clicked) {
					numFirstMatchClickedOld++;
				}
				if (user.matches[0].reply) {
					numFirstMatchRepliedOld++;
				}
				numFirstMatchTimetoOld += new Date(user.matches[0].date) - user.firstTextTime
			}

			if (user.matches[1].address) {
				numSecondMatchOld++;

				if (user.matches[0].clicked) {
					numSecondMatchClickedOld++;
				}
				if (user.matches[0].reply) {
					numSecondMatchRepliedOld++;
				}
				numSecondMatchTimetoOld += new Date(user.matches[1].date) - new Date(user.matches[0].date)
			}

			if (user.matches[2].address) {
				numThirdMatchOld++;

				if (user.matches[0].clicked) {
					numThirdMatchClickedOld++;
				}
				if (user.matches[0].reply) {
					numThirdMatchRepliedOld++;
				}
				numThirdMatchTimetoOld += new Date(user.matches[2].date) - new Date(user.matches[1].date)
			}
		} else {
			numUsersNew++;

			if (user.matches[0].address) {
				numFirstMatchNew++;
				if (user.matches[0].clicked) {
					numFirstMatchClickedNew++;
				}
				if (user.matches[0].reply) {
					numFirstMatchRepliedNew++;
				}
				numFirstMatchTimetoNew += new Date(user.matches[0].date) - user.firstTextTime
			}

			if (user.matches[1].address) {
				numSecondMatchNew++;

				if (user.matches[0].clicked) {
					numSecondMatchClickedNew++;
				}
				if (user.matches[0].reply) {
					numSecondMatchRepliedNew++;
				}
				numSecondMatchTimetoNew += new Date(user.matches[1].date) - new Date(user.matches[0].date)
			}

			if (user.matches[2].address) {
				numThirdMatchNew++;

				if (user.matches[0].clicked) {
					numThirdMatchClickedNew++;
				}
				if (user.matches[0].reply) {
					numThirdMatchRepliedNew++;
				}
				numThirdMatchTimetoNew += new Date(user.matches[2].date) - new Date(user.matches[1].date)
			}
		}

	}

	console.log(`
		Old users: ${numUsersOld}
		First match: ${numFirstMatchOld} / ${numFirstMatchClickedOld} clicked / ${numFirstMatchRepliedOld} replied / ${numFirstMatchTimetoOld/1000/3600/numFirstMatchOld} time (hr)
		Second match: ${numSecondMatchOld} / ${numSecondMatchClickedOld} clicked / ${numSecondMatchRepliedOld} replied / ${numSecondMatchTimetoOld/1000/3600/numSecondMatchOld} time (hr)
		Third match: ${numThirdMatchOld} / ${numThirdMatchClickedOld} clicked / ${numThirdMatchRepliedOld} replied / ${numThirdMatchTimetoOld/1000/3600/numThirdMatchOld} time (hr)

		New users: ${numUsersNew}
		First match: ${numFirstMatchNew} / ${numFirstMatchClickedNew} clicked / ${numFirstMatchRepliedNew} replied / ${numFirstMatchTimetoNew/1000/3600/numFirstMatchNew} time (hr)
		Second match: ${numSecondMatchNew} / ${numSecondMatchClickedNew} clicked / ${numSecondMatchRepliedNew} replied / ${numSecondMatchTimetoNew/1000/3600/numSecondMatchNew} time (hr)
		Third match: ${numThirdMatchNew} / ${numThirdMatchClickedNew} clicked / ${numThirdMatchRepliedNew} replied / ${numThirdMatchTimetoNew/1000/3600/numThirdMatchNew} time (hr)
	`);

	console.log(smsAll);
}

start(data, contentDiv);
