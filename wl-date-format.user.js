// ==UserScript==
// @name        WL Date Format
// @namespace   wl-date-format
// @description Adds an option to change the date format on WL.
// @version     0.1.0
// @include     http://www.warlight.net/*
// @include     https://www.warlight.net/*
// @grant       none
// @updateURL   https://github.com/kurogetsusai/wl-date-format/raw/master/wl-date-format.user.js
// ==/UserScript==

'use strict';

function getDateFromMurrican(murrican) {
	const array = murrican.split(/\/| |:/).map(number => parseInt(number, 10));

	[array[0], array[1], array[2]] = [array[2], array[0] - 1, array[1]];

	return new Date(...array);
}

function formatDate(date, format) {
	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	return format
		.replace('$YYYY',  date.getFullYear())
		.replace( '$YYY', (date.getFullYear() + '').slice(1))
		.replace(  '$YY', (date.getFullYear() + '').slice(2))
		.replace(   '$Y', (date.getFullYear() + '').slice(3))
		.replace('$MMMM',  monthNames[date.getMonth()])
		.replace( '$MMM',  monthNames[date.getMonth()].slice(0, 3))
		.replace(  '$MM', (date.getMonth() + 1 + '').padStart(2, '0'))
		.replace(   '$M',  date.getMonth() + 1)
		.replace(  '$DD', (date.getDate() + '').padStart(2, '0'))
		.replace(   '$D',  date.getDate())
		.replace(  '$hh', (date.getHours() + '').padStart(2, '0'))
		.replace(   '$h',  date.getHours())
		.replace(  '$mm', (date.getMinutes() + '').padStart(2, '0'))
		.replace(   '$m',  date.getMinutes())
		.replace(  '$ss', (date.getSeconds() + '').padStart(2, '0'))
		.replace(   '$s',  date.getSeconds());
}

function convertDate(dateString, noTime = false) {
	const dateFormatFull  = '$YYYY-$MM-$DD $hh:$mm:$ss';
	const dateFormatShort = '$YYYY-$MM-$DD';

	return formatDate(getDateFromMurrican(dateString.trim()), noTime ? dateFormatShort : dateFormatFull);
}

const pages = [
	{
		url: /^https?:\/\/www.warlight.net\/(Discussion\/MyMail|Forum\/f)/,
		action() {
			[...document.querySelectorAll('#MainSiteContent table.region > tbody > tr')]
				.slice(1)
				.forEach(tr => {
					const textNode = tr.querySelector('td:last-child').childNodes[0];

					textNode.textContent = convertDate(textNode.textContent);
				});
		}
	},
	{
		url: /^https?:\/\/www.warlight.net\/(Discussion\/\?ID=|Forum\/\d)/,
		action() {
			function fixDate(th) {
				const textNode = th.childNodes[1];

				textNode.textContent = ': ' + convertDate(textNode.textContent.slice(2));
			}

			[...document.querySelectorAll('table[id^=PostTbl_] > tbody > tr:first-child > th')]
				.forEach(th => fixDate(th));

			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutation => fixDate(mutation.target.querySelector('table > tbody > tr:first-child > th')));
			});
			const observerConfig = {
				childList: true,
				attributes: true,
				characterData: true,
				subtree: true
			};

			[...document.querySelectorAll('div[id^=PreviewDiv_]')]
				.forEach(th => observer.observe(th, observerConfig));

			[...document.querySelectorAll('div[id^=PostForDisplay_] font[color=gray]:last-child')]
				.forEach(font => {
					font.textContent = 'Edited ' + convertDate(font.textContent.slice(7));
				});
		}
	},
	{
		url: /^https?:\/\/www.warlight.net\/Profile\?p=/,
		action() {
			const textNode = [...document.querySelectorAll('#MainSiteContent > table > tbody > tr:last-child > td:nth-child(2) font')]
				.filter(font => font.textContent === 'Joined WarLight:')[0].nextSibling;

			textNode.textContent = ' ' + convertDate(textNode.textContent, true);
		}
	},
	{
		url: /^https?:\/\/www.warlight.net\/Clans\/\?ID=/,
		action() {
			const textNode = [...document.querySelectorAll('#MainSiteContent > table > tbody > tr:last-child > td:nth-child(2) font')]
				.filter(font => font.textContent === 'Created:')[0].nextSibling;

			textNode.textContent = ' ' + convertDate(textNode.textContent, true);
		}
	},
	{
		url: /^https?:\/\/www.warlight.net\/Ladder(Season|Games)\?ID=/,
		action() {
			const textNode = [...document.querySelectorAll('.ladderGamesTable > tbody > tr > td:nth-child(3)')]
				.forEach(td => {
					const textNode = td.childNodes[0];

					textNode.textContent = convertDate(textNode.textContent);
				});
		}
	}
];

pages.forEach(page => {
	if (location.href.match(page.url))
		page.action();
});
