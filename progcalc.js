const DEFAULT_PROGRAM = [
    "// To use the calculator, type in commands into the prompt on the bottom",
    "// right and press enter.",
    "//",
    "// You can type multiple commands at once by separating them with spaces - for",
    "// example, this will compute the factorial of 5 and leave it on the stack:",
    "//",
    "//    1 2 3 4 5 * * * *",
    "//",
    "// In addition to some basic numeric functions, there are a few special",
    "// commands:",
    "//",
    "// - You can reload the functions definitions using 'execute'",
    "//",
    "// - You can save the function definitions using 'save'. This uses localstorage,",
    "//   so it will persist even if you leave the page.",
    "//",
    "// - You can load and evaluate your saved function definitions using 'load'.",
    "//",
    "// - Finally, you can insert the default definitions using 'reset'.",
    "",
    "progcalc.register('+', (stack) => {",
    "    const b = stack.pop();",
    "    const a = stack.pop();",
    "    stack.push(a + b);",
    "});",
    "",
    "progcalc.register('-', (stack) => {",
    "    const b = stack.pop();",
    "    const a = stack.pop();",
    "    stack.push(a - b);",
    "});",
    "",
    "progcalc.register('++', (stack) => {",
    "    const a = stack.pop();",
    "    stack.push(a + 1);",
    "});",
    "",
    "progcalc.register('--', (stack) => {",
    "    const a = stack.pop();",
    "    stack.push(a - 1);",
    "});",
    "",
    "progcalc.register('*', (stack) => {",
    "    const b = stack.pop();",
    "    const a = stack.pop();",
    "    stack.push(a * b);",
    "});",
    "",
    "progcalc.register('/', (stack) => {",
    "    const b = stack.pop();",
    "    const a = stack.pop();",
    "    stack.push(a / b);",
    "});",
    "",
    "progcalc.register('neg', (stack) => {",
    "    const a = stack.pop();",
    "    stack.push(-a);",
    "});",
    "",
    "progcalc.register('dup', (stack) => {",
    "    const a = stack.pop();",
    "    stack.push(a);",
    "    stack.push(a);",
    "});",
    "",
    "progcalc.register('drop', (stack) => {",
    "    stack.pop();",
    "});",
    "",
    "progcalc.register('sum', (stack) => {",
    "    let total = 0;",
    "    while (!stack.empty()) {",
    "        total += stack.pop();",
    "    }",
    "    stack.push(total);",
    "});",
    "",
    "progcalc.register('clear', (stack) => {",
    "    while (!stack.empty()) {",
    "        stack.pop();",
    "    }",
    "});",
].join("\n");

let progcalc = {
    _stack: [],
    _functions: {},

    _stackUI: document.getElementById("stack"),
    _codeUI: document.getElementById("program"),
    _messageUI: document.getElementById("messages"),
    _promptUI: document.getElementById("prompt"),

    _init: function() {
        this._codeUI.value = DEFAULT_PROGRAM;
        this._promptUI.addEventListener('keydown', this._executePrompt.bind(this));
        this._evaluateFunctions();
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
            this._messageUI.innerText = "Definitions loaded";
        } catch (err) {
            this._messageUI.innerText = "Line: " + err.line + ": " + err.message;
        }
    },

    _saveProgram: function() {
        window.localStorage.setItem("program", this._codeUI.value);
    },

    _loadProgram: function() {
        this._codeUI.value = window.localStorage.getItem("program");
        this._evaluateFunctions();
    },

    _executePrompt: function(event) {
        if (event.key != "Enter") {
            return;
        }

        event.preventDefault();
        let commandWords = this._promptUI.value.split(" ");
        let aborted = false;

        commandWords.forEach((command) => {
            if (command === "") return;
            if (aborted) return;

            command = command.toLowerCase();
            if (!isNaN(Number(command))) {
                this._stack.push(Number(command));
            } else if (command == "execute") {
                this._evaluateFunctions();
            } else if (command == "save") {
                this._saveProgram();
            } else if (command == "load") {
                this._loadProgram();
            } else if (command in this._functions) {
                try {
                    this._functions[command](this);
                } catch (err) {
                    this._messageUI.innerText = "Error in " + command + ": " + err.message;
                    aborted = true;
                }
            } else {
                this._messageUI.innerText = "Command " + command + " is not defined";
                aborted = true;
            }
        });

        if (!aborted) {
            this._messageUI.innerText = "OK";
        }

        this._promptUI.value = "";
        this._renderStack();
    },

    // External interface exposed to scripts
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
        if (command === 'execute' || command === 'save' || command == 'load') {
            throw new Error(command + " is a reserved command and cannot be redefined");
        }

        if (!isNaN(Number(command))) {
            throw new Error("Numeric values cannot be used as commands");
        }

        this._functions[command] = func;
    }
};

progcalc._init();
