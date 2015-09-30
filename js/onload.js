window.onload = function () {
    var e = new TrelloChrome();
    e.bind(window);

    if (location.search != "?focusHack") location.search = "?focusHack";
};