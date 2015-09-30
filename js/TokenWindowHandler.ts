/// <reference path="chrome.d.ts" />

window.onload = () => {
    var parts = window.location.href.split("#token=");
    window.localStorage.setItem("trellochrome_token", parts[1]);
};