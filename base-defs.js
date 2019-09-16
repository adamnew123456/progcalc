// To use the calculator, type in commands into the prompt on the bottom
// right and press enter.
//
// You can type multiple commands at once by separating them with spaces - for
// example, this will compute the factorial of 5 and leave it on the stack:
//
//    1 2 3 4 5 * * * *

// BUILTIN FUNCTIONS
// - 'execute' clears the old definitions and executes the code view
//
// - 'save' saves the contents of the code view into localStorage, so that it persists for later
//   visits
//
// - 'load' clears the old definitions and reloads your saved code. If you do not have
//   any then the default definitions are loaded instead.
//
// - 'reset' clears your saved code and reloads the default code

// STACK FUNCTIONS
// - 'dup' copies the top-most element of the stack
//
// - 'drop' removes the top-most element of the stack
//
// - 'clear' removes all elements from the stack

progcalc.register('dup', (stack) => {
    const a = stack.pop();
    stack.push(a);
    stack.push(a);
});

progcalc.register('drop', (stack) => {
    stack.pop();
});

progcalc.register('clear', (stack) => {
    while (!stack.empty()) {
        stack.pop();
    }
});


// ARITHMETIC OPERATORS
// - '+' '-' '*' '/' are all binary operators. They can be used in various modes:
//
//    2 3 * => 6                      value
//    [1 2 3] 4 * => [4 8 12]         scalar
//    [1 2 3] [4 5 6] * => [4 10 18]  element-wise
//
// - 'neg' is a unary operator which works similarly to the binary operators:
//
//    2 neg => -2
//    [1 2 -3] neg => [-1 -2 3]

progcalc.register('+', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    let output = null;

    if (stack.isList(a) && stack.isList(b)) {
        output = stack.zip(a, b).map(ab => ab[0] + ab[1]);
    } else if (stack.isList(a)) {
        output = a.map(x => x + b);
    } else if (stack.isList(b)) {
        output = b.map(x => a + x);
    } else {
        output = a + b;
    }

    stack.push(output);
});

progcalc.register('-', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    let output = null;

    if (stack.isList(a) && stack.isList(b)) {
        output = stack.zip(a, b).map(ab => ab[0] - ab[1]);
    } else if (stack.isList(a)) {
        output = a.map(x => x - b);
    } else if (stack.isList(b)) {
        output = b.map(x => a - x);
    } else {
        output = a - b;
    }

    stack.push(output);
});

progcalc.register('*', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    let output = null;

    if (stack.isList(a) && stack.isList(b)) {
        output = stack.zip(a, b).map(ab => ab[0] * ab[1]);
    } else if (stack.isList(a)) {
        output = a.map(x => x * b);
    } else if (stack.isList(b)) {
        output = b.map(x => a * x);
    } else {
        output = a * b;
    }

    stack.push(output);
});

progcalc.register('/', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    let output = null;

    if (stack.isList(a) && stack.isList(b)) {
        output = stack.zip(a, b).map(ab => ab[0] / ab[1]);
    } else if (stack.isList(a)) {
        output = a.map(x => x / b);
    } else if (stack.isList(b)) {
        output = b.map(x => a / x);
    } else {
        output = a / b;
    }

    stack.push(output);
});

progcalc.register('neg', (stack) => {
    const a = stack.pop();
    let output = null;

    if (stack.isList(a)) {
        a.map(x => -x);
    } else {
        output = -a;
    }

    stack.push(output);
});

// LIST MANIPULATION FUNCTIONS
//
// - 'empty' pushes the empty list
//
// - '@' combines the top two values onto the stack, flatly
//
//   1 2 @ => [1 2]
//   [1 2] 3 @ => [1 2 3]
//   1 [2 3] @ => [1 2 3]
//   [1 2] [3 4] @ => [1 2 3 4]
//
// - 'sum' and 'product' compute the respective operations over the top-most value
//   1 sum => 1
//   [1 2 3] sum => 6
//
// - 'count' counts the number of values on the top-most element
//   1 count => -1
//   [1 2 3] count => 3

progcalc.register('empty', (stack) => {
    stack.push([]);
});

progcalc.register('@', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    let bval = b;
    let aval = a;

    if (!stack.isList(a)) {
        aval = [a];
    }

    if (!stack.isList(b)) {
        bval = [b];
    }

    stack.push(aval.concat(bval));
});

progcalc.register('sum', (stack) => {
    const a = stack.pop();
    let output = null;

    if (stack.isList(a)) {
        output = 0;
        a.forEach(x => output += x);
    } else {
        output = a;
    }

    stack.push(output);
});

progcalc.register('product', (stack) => {
    const a = stack.pop();
    let output = null;

    if (stack.isList(a)) {
        output = 1;
        a.forEach(x => output *= x);
    } else {
        output = a;
    }

    stack.push(output);
});

progcalc.register('count', (stack) => {
    const a = stack.pop();
    let output = null;

    if (stack.isList(a)) {
        output = a.length;
    } else {
        output = -1;
    }

    stack.push(output);
});
