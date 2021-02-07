
.PHONY: clean install

EXTNAME = top-bar-uptime
EXTZIP  = $(EXTNAME).zip

SRC  = $(EXTNAME)/extension.js
SRC += $(EXTNAME)/metadata.json
SRC += $(EXTNAME)/stylesheet.css

$(EXTZIP): $(SRC)
	zip -r $@ $(SRC)

install: $(EXTZIP)
	gnome-extensions uninstall $(EXTNAME) || true
	gnome-extensions install --force $(EXTZIP)
	gnome-extensions enable $(EXTNAME)
	#gnome-shell --replace
	#gsettings set org.gnome.shell disable-user-extensions false

clean:
	rm -f $(EXTZIP)
