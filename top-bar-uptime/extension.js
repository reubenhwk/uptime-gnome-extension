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

import GObject from 'gi://GObject';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const ByteArray = imports.byteArray;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

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

function format_uptime(s, v, sec_per_unit, unit, plural_unit) {
	let next_timeout = sec_per_unit - (s % sec_per_unit);
	if (v == 1)
		return [v.toString() + " " + unit, next_timeout, s];
	return [v.toString() + " " + plural_unit, next_timeout, s];
}

function human_friendly_uptime() {
	let s = uptime_in_seconds();
	log("uptime is " + s + " seconds");

	let sec_per_minute = 60;
	let m = Math.floor(s / sec_per_minute);

	let sec_per_hour = 60 * 60;
	let h = Math.floor(s / sec_per_hour);

	let sec_per_day = 60 * 60 * 24;
	let d = Math.floor(s / sec_per_day);

	let sec_per_week = 60 * 60 * 24 * 7;
	let w = Math.floor(s / sec_per_week);

	let sec_per_month = 60 * 60 * 24 * 30.4;
	let M = Math.floor(s / sec_per_month);

	let sec_per_year = 60 * 60 * 24 * 365;
	let y = Math.floor(s / sec_per_year);

	if (y >= 1) {
		return format_uptime(s, y, sec_per_year, "year", "years");
	}
	if (M >= 2) {
		return format_uptime(s, M, sec_per_month, "month", "months");
	}
	if (w >= 2) {
		return format_uptime(s, w, sec_per_week, "week", "weeks");
	}
	if (d >= 2) {
		return format_uptime(s, d, sec_per_day, "day", "days");
	}
	if (h >= 2) {
		return format_uptime(s, h, sec_per_hour, "hour", "hours");
	}
	if (m >= 5) {
		return format_uptime(s, m, sec_per_minute, "minute", "minutes");
	}
	if (s >= 1) {
		return format_uptime(s, s, 1, "second", "seconds");
	}

	return ["0", 1, s];
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        stbin = new St.Bin({ style_class: 'panel-label' });
        this.add_child(stbin);
        let timeout = this.redraw();
        this.setTimer(timeout);
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

    redraw() {
        let now = human_friendly_uptime();
        let uptime = "uptime: " + now[0];
        log('updating top bar uptime to "' + uptime + '"');
        stbin.set_child(
            new St.Label({ text: uptime, style_class: 'uptime-style' })
        );
        return now[1];
    }
});

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
