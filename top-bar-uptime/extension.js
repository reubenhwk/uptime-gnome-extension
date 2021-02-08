/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const ByteArray = imports.byteArray;

var stbin;
var event_id;

function Utf8ArrayToStr(array) {
    let out, i, len, c;
    let char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
	    c = array[i++];
	    switch(c >> 4)
	    {
	      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
		// 0xxxxxxx
		out += String.fromCharCode(c);
		break;
	      case 12: case 13:
		// 110x xxxx   10xx xxxx
		char2 = array[i++];
		out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
		break;
	      case 14:
		// 1110 xxxx  10xx xxxx  10xx xxxx
		char2 = array[i++];
		char3 = array[i++];
		out += String.fromCharCode(((c & 0x0F) << 12) |
			       ((char2 & 0x3F) << 6) |
			       ((char3 & 0x3F) << 0));
		break;
	    }
    }

    return out;
}

function readFile(filename) {
	return ByteArray.toString(GLib.file_get_contents(filename)[1]);
}

function uptime_in_seconds() {
	let uptime_file_contents = readFile('/proc/uptime');
	return parseInt(uptime_file_contents);
}

function round_down_to_string(n) {
	return Math.floor(n).toString();
}

function human_friendly_uptime() {
	let s = uptime_in_seconds();
	log("uptime is " + s + " seconds");
	let m = Math.floor(s / 60);
	let h = Math.floor(s / (60 * 60));
	let d = Math.floor(s / (60 * 60 * 24));
	let y = Math.floor(s / (60 * 60 * 24 * 365));

	if (y >= 1) {
		let sec_per_unit = 60 * 60 * 24 * 365;
		let next_timeout = sec_per_unit - (s % sec_per_unit) + 1;
		if (y == 1)
			return [round_down_to_string(y) + " year", next_timeout, s];
		if (y > 1)
			return [round_down_to_string(y) + " years", next_timeout, s];
	}
	if (d >= 1) {
		let sec_per_unit = 60 * 60 * 24;
		let next_timeout = sec_per_unit - (s % sec_per_unit) + 1;
		if (d == 1)
			return [round_down_to_string(d) + " day", next_timeout, s];
		if (d > 1)
			return [round_down_to_string(d) + " days", next_timeout, s];
	}
	if (h >= 1) {
		let sec_per_unit = 60 * 60;
		let next_timeout = sec_per_unit - (s % sec_per_unit) + 1;
		if (h == 1)
			return [round_down_to_string(h) + " hour", next_timeout, s];
		if (h > 1)
			return [round_down_to_string(h) + " hours", next_timeout, s];
	}
	if (m >= 1) {
		let sec_per_unit = 60;
		let next_timeout = sec_per_unit - (s % sec_per_unit) + 1;
		if (m == 1)
			return [round_down_to_string(m) + " minute", next_timeout, s];
		if (m > 1)
			return [round_down_to_string(m) + " minutes", next_timeout, s];
	}
	if (s >= 1) {
		if (s == 1)
			return [round_down_to_string(s) + " second", 1, s];
		if (s > 1)
			return [round_down_to_string(s) + " seconds", 1, s];
	}

	return ["0", 1, s];
}

class Extension {
	constructor() {
		log('uptime extension constructor');
	}

	redraw() {
		let now = human_friendly_uptime();
		let uptime = "uptime: " + now[0];
		log('updating top bar uptime to "' + uptime + '"');
		stbin.set_child(
			new St.Label({ text: uptime, style_class: 'uptime-style' })
		);
		return now[1];
	}

	tick() {
		let timeout = this.redraw();
		this.setTimer(timeout);
		return false
	}

	setTimer(timeout) {
		event_id = Mainloop.timeout_add_seconds(timeout, () => {
			this.tick();
		})
		log('reset timeout to ' + timeout + ' seconds, event ID is ' + event_id);
	}

	enable() {
		log('enabling uptime extension');
		log('adding uptime st.bin');
		stbin = new St.Bin({ style_class: 'panel-label' });
		Main.panel._rightBox.insert_child_at_index(stbin, 0);
		let timeout = this.redraw();
		this.setTimer(timeout);
	}

	disable() {
		log('disabling uptime extension');
		log('removing uptime timeout event id ' + event_id);
		Mainloop.source_remove(event_id);
		log('removing uptime st.bin');
		Main.panel._rightBox.remove_child(stbin);
	}
}

function init() {
	log('initializing uptime extention');
	return new Extension();
}

