/// <reference path="chrome.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="underscore.d.ts" />
/// <reference path="stringscore.d.ts" />

class MemberBoards {
    private token = localStorage.getItem("trellochrome_token");
    private boardsUrl: string;

    private boards;

    public static instance: MemberBoards;

    public static initialize() {
        MemberBoards.instance = new MemberBoards();
        MemberBoards.instance.loadBoards();
    }

    constructor() {
        this.boardsUrl = "https://trello.com/1/members/me" +
            "?boards=open" +
            "&board_fields=name,url" +
            "&fields=none" +
            "&key=41257716bae3f0f35422a228fbd18c97" +
            "&token=" + this.token;
    }

    public loadBoards() {
        this.boards = JSON.parse(localStorage.getItem("boards"));
        jQuery.get(this.boardsUrl, (data) => this.handleBoardsLoaded(data.boards));
    }

    private handleBoardsLoaded(boards) {
        this.boards = boards;
        localStorage.setItem("boards", JSON.stringify(boards));
    }

    public getBestBoardForSuggestion(text) {
        var possibleMatches = _.filter(this.boards, (b) => {
            return b.name.toUpperCase().match(text.toUpperCase().replace(/\s+/g, '.+'));
        });

        if (possibleMatches.length == 0) {
            return null;
        }

        return _.max(possibleMatches, (b) => {
            var score = b.name.score(text, 0.5);
            return score * 100;
        });
    }

    public getBoardsForSuggestion(text) {
        var possibleMatches = _.filter(this.boards, (b) => {
            return b.name.toUpperCase().match(text.toUpperCase().replace(/\s+/g, '.+'));
        });

        return _.sortBy(possibleMatches, (b) => {
            var score = -1 * b.name.score(text, 0.5);
            // Sort by is ascending so deal with that craziness
            return score * 100;
        });
    }
}

chrome.omnibox.onInputChanged.addListener(
    (text: string, suggest: (suggestResults: any) => void) => {
        var boards = MemberBoards.instance.getBoardsForSuggestion(text);

        var results = _.map(boards, (b) => {
            return { content: b.url, description: b.name };
        });

        if (results.length > 0) {
           chrome.omnibox.setDefaultSuggestion({ description: results[0].description });
           results.splice(0, 1);
        }
        else {
            chrome.omnibox.setDefaultSuggestion({ description: "Search Trello for " + text });
        }

        suggest(results);
});

chrome.omnibox.onInputStarted.addListener(() => {
    MemberBoards.initialize();
});

chrome.omnibox.onInputEntered.addListener((url) => {
    if (url.indexOf("https://") == 0) {
        // Selected board
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: url});
        });
    }
    else {
        // Open the first result
        var board = MemberBoards.instance.getBestBoardForSuggestion(url);
        var finalUrl = board == null ? "https://trello.com/search?q=" + url : board.url;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, { url: finalUrl });
        });
    }   
});