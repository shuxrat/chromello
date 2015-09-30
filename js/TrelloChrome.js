var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var log = function () {
    var args = [];
    for (var _i = 0; _i < (arguments.length - 0); _i++) {
        args[_i] = arguments[_i + 0];
    }
    if (window.console) {
        window.console.log(JSON.stringify(args));
    }
};

var CreateCardView = (function (_super) {
    __extends(CreateCardView, _super);
    function CreateCardView() {
        var _this = this;
        log("CreateCardView", "ctor", "begin");

        this.el = $("#create-card");
        this.createCardText = $("#create-card-text");
        this.createCardSubmit = $("#create-card-submit");
        this.cardCreateStatus = $("#card-create-status");
        this.cardCreateForm = $("#create-card-form");
        this.cardCreatedTemplate = _.template($("#card-created-template").html());

        this.boardsFetched = false;

        this.events = {
            "change #create-card-board": "boardSelected",
            "change #create-card-lists": "listSelected",
            "submit #create-card-form": "confirmCardCreate"
        };

        _super.call(this);

        // Note -- the ID is to do battle with localStorage.
        this.state = new CreateCardState({ id: "state" });
        this.boards = new Boards();
        this.lists = new Lists();

        // Bind all the things
        _.bindAll(this, "render", "boardSelected", "listSelected", "confirmCardCreate", "onTextareaKeyPress");

        this.createCardText.bind("keyup", function (e) {
            return _this.onTextareaKeyPress(e);
        });
        this.listenTo(this.boards, "sync", this.updateBoardsSelect);
        this.listenTo(this.lists, "sync", this.updateListsSelect);

        // Initialize the selectors.
        var baseSelectOpts = {
            matcher: this.fuzzyMatcher,
            formatSelection: function (a) {
                return a.name;
            },
            formatResult: function (a) {
                return a.name;
            },
            width: "100%"
        };

        // First the boards!
        this.boardSelectEl = $("#create-card-board").select2(_.extend(baseSelectOpts, {
            data: function () {
                return _this.getBoardDataForSelect();
            },
            placeholder: "Select board"
        }));

        this.listSelectEl = $("#create-card-lists").select2(_.extend(baseSelectOpts, {
            data: function () {
                return _this.getListDataForSelect();
            },
            placeholder: "Select list"
        }));

        this.state.fetch();
        this.boards.fetch();

        var selectedBoard = this.state.getSelectedBoard();
        if (selectedBoard != null && selectedBoard.id != "") {
            this.boards.add(selectedBoard);
            this.lists.idBoard = selectedBoard.id;

            var list = this.state.getSelectedList();
            if (list != null) {
                this.lists.add(list);
            }

            this.lists.fetch();

            this.boardSelectEl.val(selectedBoard.get('id')).trigger("change");

            if (list != null) {
                this.listSelectEl.val(list.get('id')).trigger("change");
            }
        }

        this.createCardText.focus();

        log("CreateCardView", "ctor", "end");
    }
    CreateCardView.prototype.onPickerFocused = function (e) {
        $(e.target).select2("open");
    };

    CreateCardView.prototype.getBoardDataForSelect = function () {
        log("getBoardDataForSelect");

        var ret = {
            results: this.boards.models.map(function (board) {
                return board.toJSON();
            }),
            text: function (b) {
                return b.name;
            }
        };

        return ret;
    };

    CreateCardView.prototype.getListDataForSelect = function () {
        log("getListDataForSelect");

        var ret = {
            results: this.lists.models.map(function (list) {
                return list.toJSON();
            }),
            text: function (b) {
                return b.name;
            }
        };

        return ret;
    };

    CreateCardView.prototype.fuzzyMatcher = function (term, text, opt) {
        return text.toUpperCase().match(term.toUpperCase().replace(/\s+/g, '.+'));
    };

    CreateCardView.prototype.onTextareaKeyPress = function (e) {
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            this.cardCreateForm.submit();
        }
    };

    CreateCardView.prototype.updateBoardsSelect = function () {
        this.boardSelectEl.trigger("change");
    };

    CreateCardView.prototype.updateListsSelect = function () {
        this.listSelectEl.trigger("change");
    };

    CreateCardView.prototype.confirmCardCreate = function () {
        var _this = this;
        var card = this.createCardText.val();
        var list = this.state.getSelectedList();
        var listId = list == null ? null : list.get('id');

        log("confirmCardCreate", card, listId);

        if (card == null || card.length == 0 || listId == null) {
            this.createCardText.val("");
            return false;
        }

        // Disable everything!
        this.createCardSubmit.addClass("btn-warning");
        this.createCardSubmit.html("Saving..");
        this.createCardSubmit.attr("disabled", "disabled");
        this.createCardText.attr("disabled", "disabled");
        this.cardCreateForm.attr("disabled", "disabled");
        this.cardCreateStatus.html("");

        // Weee
        var jqr = $.post(TrelloContext.getSignedUrl("/cards"), { name: card, idList: listId, pos: "bottom" }, function (card) {
            return _this.handleCardCreated(card);
        }, "json");

        jqr.fail(function () {
            return _this.handleCardCreateFailed();
        });

        return false;
    };

    CreateCardView.prototype.restoreCreateButton = function () {
        this.createCardSubmit.removeClass("btn-warning");
        this.createCardSubmit.html("Create");
        this.createCardSubmit.removeAttr("disabled");
        this.createCardText.removeAttr("disabled");
        this.cardCreateForm.removeAttr("disabled");
    };

    CreateCardView.prototype.handleCardCreateFailed = function () {
        this.restoreCreateButton();
        this.cardCreateStatus.html('<div class="alert alert-danger">' + 'Unable to create the card. Please unclog your Internet tubes.' + '</div>');
    };

    CreateCardView.prototype.handleCardCreated = function (card) {
        this.restoreCreateButton();
        this.cardCreateStatus.html(this.cardCreatedTemplate(card));
        this.createCardText.val("");
        this.createCardText.focus();
    };

    CreateCardView.prototype.getCurrentBoard = function () {
        var id = this.boardSelectEl.val();
        var board = this.boards.get(id);
        return board;
    };

    CreateCardView.prototype.getCurrentList = function () {
        var id = this.listSelectEl.val();
        var list = this.lists.get(id);
        return list;
    };

    CreateCardView.prototype.listSelected = function () {
        var list = this.getCurrentList();
        log("listSelected ", list == null ? "null" : list.id);
        this.state.setListSelected(list);
    };

    CreateCardView.prototype.boardSelected = function () {
        var board = this.getCurrentBoard();

        log("boardSelected ", board == null ? "null" : board.id);

        if (board == null) {
            return;
        }

        this.state.setBoardSelected(board);

        if (this.lists.idBoard != board.id) {
            this.lists.reset();
            this.listSelectEl.val("");

            this.lists.idBoard = board.id;
            this.lists.fetch();
        }
    };

    CreateCardView.prototype.render = function () {
        log("CreateCardView", "render");
        return this;
    };
    return CreateCardView;
})(Backbone.View);

var TrelloChrome = (function () {
    function TrelloChrome() {
    }
    TrelloChrome.prototype.toStorage = function (key, data) {
        this.window.localStorage.setItem("trellochrome_" + key, JSON.stringify(data));
    };

    TrelloChrome.prototype.getFromStorage = function (key) {
        return this.window.localStorage.getItem("trellochrome_" + key);
    };

    TrelloChrome.prototype.getToken = function () {
        // Testing locally?
        var parts = this.window.location.href.split("#token=");
        if (parts.length > 1) {
            return parts[1];
        }

        return this.getFromStorage("token");
    };

    TrelloChrome.prototype.isLoggedIn = function () {
        var token = this.getToken();
        return token != null && token.length > 0;
    };

    // Authenticates with Trello.
    TrelloChrome.prototype.authenticate = function () {
        if (this.isLoggedIn()) {
            return;
        }

        var returnUrl = chrome.extension.getURL("token.html");
        chrome.windows.create({
            url: "https://trello.com/1/authorize?" + "response_type=token" + "&key=41257716bae3f0f35422a228fbd18c97" + "&response_type=token" + "&return_url=" + encodeURI(returnUrl) + "&scope=read,write,account&expiration=never" + "&name=Chromello",
            width: 520,
            height: 620,
            type: "panel",
            focused: true
        });
    };

    TrelloChrome.prototype.initialize = function () {
        log("initialize");

        this.loggedOut.hide();
        this.loggedIn.show();

        TrelloContext.initialize("41257716bae3f0f35422a228fbd18c97", this.getToken());
        var view = new CreateCardView();
    };

    TrelloChrome.prototype.bind = function (inWindow) {
        var _this = this;
        log("bind");

        this.window = inWindow;
        $("#connectLink").click(function () {
            _this.authenticate();
        });

        this.loggedIn = $("#loggedIn");
        this.loggedOut = $("#loggedOut");

        if (this.isLoggedIn()) {
            this.initialize();
        } else {
            this.loggedOut.show();
            this.loggedIn.hide();
        }
    };
    return TrelloChrome;
})();
//# sourceMappingURL=TrelloChrome.js.map
