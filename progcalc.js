function xhr(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('GET', url);
        request.onabort = () => reject('Aborted');
        request.onerror = () => reject('Received error');
        request.ontimeout = () => reject('Timed out');
        request.onload = () => resolve(request.responseText);
        request.send();
    });
}

let progcalc = {
    _stack: [],
    _functions: {},

    _stackUI: document.getElementById("stack"),
    _codeUI: document.getElementById("program"),
    _messageUI: document.getElementById("messages"),
    _promptUI: document.getElementById("prompt"),
    _defaultProgram: "",

    _init: function() {
        xhr('base-defs.js').then(default_program => {
            this._defaultProgram = default_program;
            this._promptUI.addEventListener('keydown', this._executePrompt.bind(this));
            if (this._loadProgram()) {
                this.message('Local definitions loaded');
            } else {
                this._evaluateFunctions();
                this.message('Default definitions loaded');
            }
        });
    },

    _renderStack: function() {
        while (this._stackUI.firstChild) {
            this._stackUI.removeChild(this._stackUI.firstChild);
        }

        for (let i = this._stack.length - 1; i >= 0; i--) {
            let node = document.createElement('div');
            node.innerText = this._stack[i].toString();
            this._stackUI.appendChild(node);
        }
    },

    _evaluateFunctions: function() {
        this._functions = {};
        try {
            eval(this._codeUI.value);
            this.message("Definitions loaded");
        } catch (err) {
            this.message("Line: " + err.line + ": " + err.message);
        }
    },

    _saveProgram: function() {
        window.localStorage.setItem("program", this._codeUI.value);
    },

    _loadProgram: function() {
        let loaded = window.localStorage.getItem("program");
        if (loaded) {
            this._codeUI.value = loaded;
            this._evaluateFunctions();
            return true;
        } else {
            this.message('Aborted load as no definitions are available');
            return false;
        }
    },

    _executePrompt: function(event) {
        if (event.key != "Enter") {
            return;
        }

        this.message('OK');

        event.preventDefault();
        let commandWords = this._promptUI.value.split(" ");
        let aborted = false;

        commandWords.forEach((command) => {
            if (command === "") return;
            if (aborted) return;

            try {
                this.invoke(command);
            } catch (err) {
                this.message("Error in " + command + ": " + err.message);
                aborted = true;
            }
        });

        this._promptUI.value = "";
        this._renderStack();
    },

    // External interface exposed to scripts
    message: function(msg) {
        this._messageUI.innerText = msg;
    },

    invoke: function(command) {
        command = command.toLowerCase();
        if (!isNaN(Number(command))) {
            this._stack.push(Number(command));
        } else if (command == "execute") {
            this._evaluateFunctions();
        } else if (command == "save") {
            this._saveProgram();
        } else if (command == "load") {
            this._loadProgram();
        } else if (command == "reset") {
            window.localStorage.removeItem("program");
            this._codeUI.value = this._defaultProgram;
            this._evaluateFunctions();
            this.message("Default definitions restored and loaded");
        } else if (command in this._functions) {
            this._functions[command](this);
        } else {
            throw new Error("Command " + command + " is not defined");
        }
    },

    empty: function() {
        return this._stack.length === 0;
    },

    depth: function() {
        return this._stack.length;
    },

    push: function(value) {
        this._stack.push(value);
    },

    pop: function() {
        if (this._stack.length === 0) {
            throw new Error("Stack underflow");
        } else {
            return this._stack.pop();
        }
    },

    register: function(command, func) {
        command = command.toLowerCase();
        if (command === 'execute' || command === 'save' || command == 'load' || command == 'reset') {
            throw new Error(command + " is a reserved command and cannot be redefined");
        }

        if (!isNaN(Number(command))) {
            throw new Error("Numeric values cannot be used as commands");
        }

        this._functions[command] = func;
    }
};

progcalc._init();
