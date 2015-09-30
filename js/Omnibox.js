/// <reference path="chrome.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="underscore.d.ts" />
/// <reference path="stringscore.d.ts" />
var MemberBoards = (function () {
    function MemberBoards() {
        this.token = localStorage.getItem("trellochrome_token");
        this.boardsUrl = "https://trello.com/1/members/me" + "?boards=open" + "&board_fields=name,url" + "&fields=none" + "&key=41257716bae3f0f35422a228fbd18c97" + "&token=" + this.token;
    }
    MemberBoards.initialize = function () {
        MemberBoards.instance = new MemberBoards();
        MemberBoards.instance.loadBoards();
    };

    MemberBoards.prototype.loadBoards = function () {
        var _this = this;
        this.boards = JSON.parse(localStorage.getItem("boards"));
        jQuery.get(this.boardsUrl, function (data) {
            return _this.handleBoardsLoaded(data.boards);
        });
    };

    MemberBoards.prototype.handleBoardsLoaded = function (boards) {
        this.boards = boards;
        localStorage.setItem("boards", JSON.stringify(boards));
    };

    MemberBoards.prototype.getBestBoardForSuggestion = function (text) {
        var possibleMatches = _.filter(this.boards, function (b) {
            return b.name.toUpperCase().match(text.toUpperCase().replace(/\s+/g, '.+'));
        });

        if (possibleMatches.length == 0) {
            return null;
        }

        return _.max(possibleMatches, function (b) {
            var score = b.name.score(text, 0.5);
            return score * 100;
        });
    };

    MemberBoards.prototype.getBoardsForSuggestion = function (text) {
        var possibleMatches = _.filter(this.boards, function (b) {
            return b.name.toUpperCase().match(text.toUpperCase().replace(/\s+/g, '.+'));
        });

        return _.sortBy(possibleMatches, function (b) {
            var score = -1 * b.name.score(text, 0.5);

            // Sort by is ascending so deal with that craziness
            return score * 100;
        });
    };
    return MemberBoards;
})();

chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
    var boards = MemberBoards.instance.getBoardsForSuggestion(text);

    var results = _.map(boards, function (b) {
        return { content: b.url, description: b.name };
    });

    if (results.length > 0) {
        chrome.omnibox.setDefaultSuggestion({ description: results[0].description });
        results.splice(0, 1);
    } else {
        chrome.omnibox.setDefaultSuggestion({ description: "Search Trello for " + text });
    }

    suggest(results);
});

chrome.omnibox.onInputStarted.addListener(function () {
    MemberBoards.initialize();
});

chrome.omnibox.onInputEntered.addListener(function (url) {
    if (url.indexOf("https://") == 0) {
        // Selected board
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.update(tabs[0].id, { url: url });
        });
    } else {
        // Open the first result
        var board = MemberBoards.instance.getBestBoardForSuggestion(url);
        var finalUrl = board == null ? "https://trello.com/search?q=" + url : board.url;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.update(tabs[0].id, { url: finalUrl });
        });
    }
});
//# sourceMappingURL=Omnibox.js.map
