// To use the calculator, type in commands into the prompt on the bottom
// right and press enter.
//
// You can type multiple commands at once by separating them with spaces - for
// example, this will compute the factorial of 5 and leave it on the stack:
//
//    1 2 3 4 5 * * * *
//
// In addition to some basic numeric functions, there are a few special
// commands:
//
// - You can reload the functions definitions using 'execute'
//
// - You can save the function definitions using 'save'. This uses localstorage,
//   so it will persist even if you leave the page.
//
// - You can load and evaluate your saved function definitions using 'load'.
//
// - Finally, you can insert the default definitions using 'reset'.

progcalc.register('+', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    stack.push(a + b);
});

progcalc.register('-', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    stack.push(a - b);
});

progcalc.register('++', (stack) => {
    const a = stack.pop();
    stack.push(a + 1);
});

progcalc.register('--', (stack) => {
    const a = stack.pop();
    stack.push(a - 1);
});

progcalc.register('*', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    stack.push(a * b);
});

progcalc.register('/', (stack) => {
    const b = stack.pop();
    const a = stack.pop();
    stack.push(a / b);
});

progcalc.register('neg', (stack) => {
    const a = stack.pop();
    stack.push(-a);
});

progcalc.register('dup', (stack) => {
    const a = stack.pop();
    stack.push(a);
    stack.push(a);
});

progcalc.register('drop', (stack) => {
    stack.pop();
});

progcalc.register('sum', (stack) => {
    let total = 0;
    while (!stack.empty()) {
        total += stack.pop();
    }
    stack.push(total);
});

progcalc.register('clear', (stack) => {
    while (!stack.empty()) {
        stack.pop();
    }
});
