/// <reference path="chrome.d.ts" />
window.onload = function () {
    var parts = window.location.href.split("#token=");
    window.localStorage.setItem("trellochrome_token", parts[1]);
};
//# sourceMappingURL=TokenWindowHandler.js.map
