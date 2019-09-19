const DEFAULT_DISPLAY = 'Primitive Functions:\n\n- new-func: Opens a new function for editing\n- save-func: Compiles the current function and adds it to your registry\n- revert-func: Resets any changes made in the editing window (also cancels a new function)\n- reset-funcs: Removes all functions from your registry and leaves only the built-ins\n\nAll other functions are defined by the base registry and have associated entries/code available via the dropdown';

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

function objectKeys(obj) {
    let keys = [];
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

function loadBaseDefs() {
    return xhr('base-defs.js').then(annotated_code => {
        let definitions = {};
        let current_function = null;
        let current_lines = [];
        annotated_code
            .split('\n')
            .forEach(line => {
                if (line.startsWith('//@ ')) {
                    if (current_function) {
                        definitions[current_function] = current_lines.join('\n');
                    }

                    current_lines = [];
                    current_function = line.split(' ')[1];
                } else {
                    current_lines.push(line);
                }
            });

        if (current_function) {
            definitions[current_function] = current_lines.join('\n');
        }

        return definitions;
    });
}

function loadUserDefs() {
    let as_json = window.localStorage.getItem("program");
    if (as_json) {
        try {
            return JSON.parse(as_json);
        } catch (err) {
            // Write back {} to avoid this happening next time
            window.localStorage.setItem("program", "{}");
            return {};
        }
    } else {
        return {};
    }
}

function compileDefs(definitions, scope) {
    let compiled = {};

    for (let key in definitions) {
        if (!definitions.hasOwnProperty(key)) continue;

        try {
            compiled[key] = new Function('stack', definitions[key]);
        } catch (err) {
            throw new Error("Error compiling " + scope + " definition for " + key + " at line " + err.lineNumber);
        }
    }

    return compiled;
}

function saveUserDefs(definitions) {
    let as_json = JSON.stringify(definitions);
    window.localStorage.setItem("program", as_json);
}

function createFunctionEnvironment(builtins, user) {
    return {
        builtins: builtins,
        compiledBuiltins: compileDefs(builtins, 'builtin'),

        user: user,
        compiledUser: compileDefs(user, 'user'),

        listDefs: function() {
            let names = objectKeys(this.builtins);

            objectKeys(this.user)
                .filter(name => !this.builtins.hasOwnProperty(name))
                .forEach(name => names.push(name));

            return names;
        },

        saveUserDefs: function() {
            saveUserDefs(this.user);
        },

        resolveCompiled: function(name) {
            if (this.compiledUser.hasOwnProperty(name)) {
                return this.compiledUser[name];
            } else if (this.compiledBuiltins.hasOwnProperty(name)) {
                return this.compiledBuiltins[name];
            } else {
                return null;
            }
        },

        resolveCode: function(name) {
            if (this.user.hasOwnProperty(name)) {
                return this.user[name];
            } else if (this.builtins.hasOwnProperty(name)) {
                return this.builtins[name];
            } else {
                return null;
            }
        },

        setUserDefs: function(defs) {
            let compiled = compileDefs(defs, 'user');

            // Only assign the user's definitions if they actually compile
            this.user = defs;
            this.compiledUser = compiled;
        },

        bindUserDef: function(name, code) {
            try {
                let compiled = new Function('stack', code);
                this.user[name] = code;
                this.compiledUser[name] = new Function('stack', code);
            } catch (err) {
                throw new Error("Error compiling user definition for " + name + " at line " + err.lineNumber);
            }
        }
    };
}

let progcalc = {
    _stack: [],
    _environment: null,
    _currentFunction: null,

    _stackUI: document.getElementById("stack"),
    _codeUI: document.getElementById("program"),
    _messageUI: document.getElementById("messages"),
    _functionListUI: document.getElementById("program-selector"),
    _promptUI: document.getElementById("prompt"),

    _init: function() {
        this._codeUI.value = DEFAULT_DISPLAY;
        loadBaseDefs().then(builtin_defs => {
            let user_defs = loadUserDefs();
            this._environment = createFunctionEnvironment(builtin_defs, user_defs);
            this._rebuildFunctionList();
            this.message('Local definitions loaded and merged');

            this._promptUI.addEventListener('keydown', this._executePrompt.bind(this));
            this._functionListUI.addEventListener('change', this._viewSource.bind(this));
        });
    },

    _rebuildFunctionList: function() {
        while (this._functionListUI.firstChild) {
            this._functionListUI.removeChild(this._functionListUI.firstChild);
        }

        // Add a default to reset the view
        let choice = document.createElement('option');
        choice.value = name;
        choice.innerText = name;
        this._functionListUI.appendChild(choice);

        this._environment.listDefs()
            .forEach(name => {
                let choice = document.createElement('option');
                choice.value = name;
                choice.innerText = name;
                this._functionListUI.appendChild(choice);
            });
    },

    _renderStack: function() {
        while (this._stackUI.firstChild) {
            this._stackUI.removeChild(this._stackUI.firstChild);
        }

        for (let i = this._stack.length - 1; i >= 0; i--) {
            let node = document.createElement('div');
            let value = this._stack[i];
            if (value instanceof Array) {
                node.innerText = '[' + value.join(' ') + ']';
            } else {
                node.innerText = value.toString();
            }
            this._stackUI.appendChild(node);
        }
    },

    _viewSource: function(event) {
        let funcName = this._functionListUI.value;
        if (!funcName) {
            this._codeUI.value = DEFAULT_DISPLAY;
            this._currentFunction = null;
            return;
        }

        this._codeUI.value = this._environment.resolveCode(funcName);
        this._currentFunction = funcName;
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
        } else if (command == "new-func") {
            let name = prompt("");
            if (name) {
                if (name.match(/[ \n\r\t]/)) {
                    throw new Error("Command name contains invalid whitespace");
                }

                if (!isNaN(Number(name))) {
                    throw new Error("Command name cannot be numeric");
                }

                this._currentFunction = name;
                this._codeUI.value = '// Write your command body here';
                this.message("New function template added for " + name);
            } else {
                this.message("New function cancelled");
            }
        } else if (command == "save-func") {
            if (!this._currentFunction) {
                throw new Error("Cannot save function when no function is being edited");
            }

            this._environment.bindUserDef(this._currentFunction, this._codeUI.value);
            this._environment.saveUserDefs();

            // In case the function is newly defined
            this._rebuildFunctionList();
            this._functionListUI.value = this._currentFunction;
            this.message("Function saved and compiled");
        } else if (command == "revert-func") {
            if (!this._currentFunction) {
                throw new Error("Cannot revert function when no function is being edited");
            }

            let existingCode = this._environment.resolveCode(this._currentFunction);
            if (!existingCode) {
                // A newly defined function which is being aborted
                this._currentFunction = null;
                this._codeUI.value = DEFAULT_DISPLAY;
                this._functionListUI.value = '';
                this.message("New function cancelled");
            } else {
                this._codeUI.value = existingCode;
                this.message("Existing function code reset");
            }
        } else if (command == "reset-funcs") {
            this._environment.setUserDefs({});
            this._environment.saveUserDefs();
            this._rebuildFunctionList();
            this.message("Default definitions restored and loaded");
        } else {
            let func = this._environment.resolveCompiled(command);
            if (func) {
                func(this);
            } else {
                throw new Error("Command " + command + " is not defined");
            }
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
    },

    elementWise: function(x, y, func) {
        if (this.isList(x) && this.isList(y)) {
            let output = [];
            for (let i = 0; i < Math.min(x.length, y.length); i++) {
                output.push(func(x[i], y[i]));
            }
            return output;
        } else if (this.isList(x)) {
            let output = [];
            for (let i = 0; i < x.length; i++) {
                output.push(func(x[i], y));
            }
            return output;
        } else if (this.isList(y)) {
            let output = [];
            for (let i = 0; i < y.length; i++) {
                output.push(func(x, y[i]));
            }
            return output;
        } else {
            return func(x, y);
        }
    },

    isList: function(x) {
        return x instanceof Array;
    },

    isScalar: function(x) {
        return !this.isList(x);
    }
};

progcalc._init();
