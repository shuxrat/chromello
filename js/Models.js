var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TrelloContext = (function () {
    function TrelloContext() {
    }
    TrelloContext.initialize = function (appKey, appToken) {
        TrelloContext.key = appKey;
        TrelloContext.token = appToken;
    };

    TrelloContext.getSignedUrl = function (url) {
        return TrelloContext.urlRoot + url + ((url.indexOf("?") == -1) ? "?" : "&") + "key=" + TrelloContext.key + "&token=" + TrelloContext.token;
    };
    TrelloContext.urlRoot = "https://trello.com/1";
    return TrelloContext;
})();

var CreateCardState = (function (_super) {
    __extends(CreateCardState, _super);
    function CreateCardState() {
        _super.apply(this, arguments);
        this.localStorage = new Store("state");
        this.defaults = {
            id: "state",
            selectedBoard: new Board({ id: "", name: "" }),
            selectedList: new List({ id: "", name: "" })
        };
    }
    CreateCardState.prototype.setBoardSelected = function (board) {
        this.set('selectedBoard', board);
        this.save();
    };

    CreateCardState.prototype.setListSelected = function (list) {
        this.set('selectedList', list);
        this.save();
    };

    CreateCardState.prototype.getSelectedBoard = function () {
        return this.selectedBoard;
    };

    CreateCardState.prototype.getSelectedList = function () {
        return this.selectedList;
    };

    CreateCardState.prototype.parse = function (response, options) {
        var ret = _super.prototype.parse.call(this, response, options);
        this.selectedBoard = new Board(response.selectedBoard);
        this.selectedList = new List(response.selectedList);
        return ret;
    };
    return CreateCardState;
})(Backbone.Model);

var Boards = (function (_super) {
    __extends(Boards, _super);
    function Boards() {
        _super.apply(this, arguments);
        this.url = TrelloContext.getSignedUrl("/members/me/boards/?filter=open&fields=id,name,url");
        this.model = Board;
    }
    return Boards;
})(Backbone.Collection);

var Board = (function (_super) {
    __extends(Board, _super);
    function Board() {
        _super.apply(this, arguments);
    }
    return Board;
})(Backbone.Model);

var Lists = (function (_super) {
    __extends(Lists, _super);
    function Lists() {
        _super.apply(this, arguments);
        var _this = this;
        this.model = List;
        this.url = function () {
            return TrelloContext.getSignedUrl("/boards/" + _this.idBoard + "/lists?filter=open");
        };
    }
    return Lists;
})(Backbone.Collection);

var List = (function (_super) {
    __extends(List, _super);
    function List() {
        _super.apply(this, arguments);
    }
    return List;
})(Backbone.Model);
//# sourceMappingURL=Models.js.map
