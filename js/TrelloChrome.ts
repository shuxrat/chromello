/// <reference path="jquery.d.ts" />
/// <reference path="select2.d.ts" />
/// <reference path="chrome.d.ts" />
/// <reference path="backbone.d.ts" />
/// <reference path="underscore.d.ts" />
/// <reference path="Models.ts" />

declare var Trello;

var log = function (...args:any[]) {
    if (window.console) {
        window.console.log(JSON.stringify(args));
    }
}

class CreateCardView extends Backbone.View {
    // Elements
    el:JQuery;
    boardSelectEl:JQuery;
    listSelectEl:JQuery;
    createCardText:JQuery;
    createCardSubmit:JQuery;
    cardCreateStatus:JQuery;
    cardCreateForm:JQuery;

    cardCreatedTemplate:(data:any) => string;

    // Sate
    boardsFetched:boolean;
    boards:Boards;
    lists:Lists;
    state:CreateCardState;

    constructor() {
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

        super();

        // Note -- the ID is to do battle with localStorage.
        this.state = new CreateCardState({ id: "state" });
        this.boards = new Boards();
        this.lists = new Lists();

        // Bind all the things
        _.bindAll(this, "render", "boardSelected", "listSelected",
            "confirmCardCreate", "onTextareaKeyPress");

        this.createCardText.bind("keyup", (e) => this.onTextareaKeyPress(e));
        this.listenTo(this.boards, "sync", this.updateBoardsSelect);
        this.listenTo(this.lists, "sync", this.updateListsSelect);

        // Initialize the selectors.
        var baseSelectOpts = {
            matcher: this.fuzzyMatcher,
            formatSelection: (a) => {
                return a.name;
            },
            formatResult: (a) => {
                return a.name;
            },
            width: "100%"
        };

        // First the boards!
        this.boardSelectEl = $("#create-card-board").select2(
            _.extend(baseSelectOpts, {
                data: () => { return this.getBoardDataForSelect(); },
                placeholder: "Select board"
            }));

        this.listSelectEl = $("#create-card-lists").select2(
            _.extend(baseSelectOpts, {
                data: () => { return this.getListDataForSelect(); },
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

    onPickerFocused(e) {
        $(e.target).select2("open");
    }

    getBoardDataForSelect() {
        log("getBoardDataForSelect");

        var ret = {
            results: this.boards.models.map((board:Board) => {
                return board.toJSON();
            }),
            text: (b) => {
                return b.name;
            }
        };

        return ret;
    }

    getListDataForSelect() {
        log("getListDataForSelect");

        var ret = {
            results: this.lists.models.map((list:List) => {
                return list.toJSON();
            }),
            text: (b) => {
                return b.name;
            }
        };

        return ret;
    }

    fuzzyMatcher(term, text, opt) {
        return text.toUpperCase().match(term.toUpperCase().replace(/\s+/g, '.+'))
    }

    onTextareaKeyPress(e:KeyboardEvent) {
        if (e.keyCode == 13 && !e.shiftKey) {
            e.preventDefault();
            this.cardCreateForm.submit();
        }
    }

    updateBoardsSelect() {
        this.boardSelectEl.trigger("change");
    }

    updateListsSelect() {
        this.listSelectEl.trigger("change");
    }

    confirmCardCreate():boolean {
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
        var jqr = $.post(TrelloContext.getSignedUrl("/cards"),
            { name: card, idList: listId, pos: "bottom" },
            (card) => this.handleCardCreated(card),
            "json");

        jqr.fail(() => this.handleCardCreateFailed());

        return false;
    }

    restoreCreateButton() {
        this.createCardSubmit.removeClass("btn-warning");
        this.createCardSubmit.html("Create");
        this.createCardSubmit.removeAttr("disabled");
        this.createCardText.removeAttr("disabled");
        this.cardCreateForm.removeAttr("disabled");
    }

    handleCardCreateFailed() {
        this.restoreCreateButton();
        this.cardCreateStatus.html('<div class="alert alert-danger">' +
            'Unable to create the card. Please unclog your Internet tubes.' +
            '</div>');
    }

    handleCardCreated(card) {
        this.restoreCreateButton();
        this.cardCreateStatus.html(this.cardCreatedTemplate(card));
        this.createCardText.val("");
        this.createCardText.focus();
    }

    private getCurrentBoard():Board {
        var id = this.boardSelectEl.val();
        var board = <Board>this.boards.get(id);
        return board;
    }

    private getCurrentList():List {
        var id = this.listSelectEl.val();
        var list = <List>this.lists.get(id);
        return list;
    }

    listSelected() {
        var list = this.getCurrentList();
        log("listSelected ", list == null ? "null" : list.id);
        this.state.setListSelected(list);
    }

    boardSelected() {
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
    }

    render() {
        log("CreateCardView", "render");
        return this;
    }
}

class TrelloChrome {
    private loggedOut:JQuery;
    private loggedIn:JQuery;
    private window:Window;

    private toStorage(key:string, data:any) {
        this.window.localStorage.setItem("trellochrome_" + key, JSON.stringify(data));
    }

    private getFromStorage(key:string):string {
        return this.window.localStorage.getItem("trellochrome_" + key);
    }

    private getToken():string {
        // Testing locally?
        var parts = this.window.location.href.split("#token=");
        if (parts.length > 1) {
            return parts[1];
        }

        return this.getFromStorage("token");
    }

    private isLoggedIn():boolean {
        var token = this.getToken();
        return token != null && token.length > 0;
    }

    // Authenticates with Trello.
    private authenticate() {
        // Check if we're auth'd already
        if (this.isLoggedIn()) {
            return;
        }

        var returnUrl = chrome.extension.getURL("token.html");
        chrome.windows.create(
            {
                url: "https://trello.com/1/authorize?" +
                    "response_type=token" +
                    "&key=41257716bae3f0f35422a228fbd18c97" +
                    "&response_type=token" +
                    "&return_url=" + encodeURI(returnUrl) +
                    "&scope=read,write,account&expiration=never" +
                    "&name=Chromello",
                width: 520,
                height: 620,
                type: "panel",
                focused: true
            });
    }

    private initialize() {
        log("initialize");

        this.loggedOut.hide();
        this.loggedIn.show();

        TrelloContext.initialize("41257716bae3f0f35422a228fbd18c97", this.getToken());
        var view = new CreateCardView();
    }

    public bind(inWindow:Window) {
        log("bind");

        this.window = inWindow;
        $("#connectLink").click(() => {
            this.authenticate();
        });

        this.loggedIn = $("#loggedIn");
        this.loggedOut = $("#loggedOut");

        if (this.isLoggedIn()) {
            this.initialize();
        }
        else {
            this.loggedOut.show();
            this.loggedIn.hide();
        }

    }
}
