/// <reference path="jquery.d.ts" />
/// <reference path="chrome.d.ts" />
/// <reference path="backbone.d.ts" />
/// <reference path="backbone.localstorage.d.ts" />
/// <reference path="underscore.d.ts" />

declare var Store: any;

class TrelloContext {
    private static key: string;
    private static token: string;
    public static urlRoot = "https://trello.com/1";

    public static initialize(appKey: string, appToken: string) {
        TrelloContext.key = appKey;
        TrelloContext.token = appToken;
    }

    public static getSignedUrl(url: String) :  string {
        return TrelloContext.urlRoot
            + url
            + ((url.indexOf("?") == -1) ? "?" : "&") + "key=" + TrelloContext.key
            + "&token=" + TrelloContext.token;
    }
}

class CreateCardState extends Backbone.Model {
    localStorage = new Store("state");

    private selectedBoard: Board;
    private selectedList: List;

    defaults = {
        id: "state",
        selectedBoard: new Board({ id: "", name: "" }),
        selectedList: new List({ id: "", name: "" })
    };

    public setBoardSelected(board: Board) {
        this.set('selectedBoard', board);
        this.save();
    }

    public setListSelected(list: List) {
        this.set('selectedList', list);
        this.save();
    }

    public getSelectedBoard(): Board {
        return this.selectedBoard;
    }

    public getSelectedList(): List {
        return this.selectedList;
    }

    parse(response, options?: any) {
        var ret = super.parse(response, options);
        this.selectedBoard = new Board(response.selectedBoard);
        this.selectedList = new List(response.selectedList);
        return ret;
    }
}

class Boards extends Backbone.Collection {
    url = TrelloContext.getSignedUrl("/members/me/boards/?filter=open&fields=id,name,url");
    model = Board;
}

class Board extends Backbone.Model {
    public name: string;
    public id: string;
}

class Lists extends Backbone.Collection {
    model = List;

    public idBoard: String;

    url = () => {
        return TrelloContext.getSignedUrl("/boards/" + this.idBoard + "/lists?filter=open");
    };
}

class List extends Backbone.Model {
    public name: string;
    public id: string;
}