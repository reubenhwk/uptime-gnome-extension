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

var label;
var mloop;

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

class Extension {
	constructor() {
		log('uptime extension constructor');

		let stuff = Utf8ArrayToStr(GLib.spawn_command_line_sync("cat /proc/uptime")[1]);
		log('uptime is ' + stuff);
		label = new St.Bin({ style_class: 'panel-label' });
		let text = new St.Label({ text: stuff });

		label.set_child(text);
	}

	redraw() {
		if (label) {
			Main.panel._rightBox.remove_child(label);
		}

		let stuff = Utf8ArrayToStr(GLib.spawn_command_line_sync("cat /proc/uptime")[1]);
		log('uptime is ' + stuff);
		label = new St.Bin({ style_class: 'panel-label' });
		let text = new St.Label({ text: stuff, style_class: 'uptime-style' });

		label.set_child(text);
		Main.panel._rightBox.insert_child_at_index(label, 0);
	}

	tick() {
		log('uptime extension mloop');
		this.startTicking();
	}

	startTicking() {
		mloop = Mainloop.timeout_add_seconds(1, () => {
			this.redraw();
			this.tick();
		})
	}

	enable() {
		log('uptime extension enable');
		this.redraw();
		this.startTicking();
	}

	disable() {
		log('uptime extension disable');
		if (label) {
			Main.panel._rightBox.remove_child(label);
		}
	}
}

function init() {
	log('initializing uptime extention');
	return new Extension();
}

