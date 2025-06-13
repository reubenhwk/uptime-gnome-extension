
.PHONY: clean install

EXTNAME = top-bar-uptime@reubenhwk
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

clean:
	rm -f $(EXTZIP)
