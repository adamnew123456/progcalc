//@ dup
// Copies the top element on the stack
const a = stack.pop();
stack.push(a);
stack.push(a);
//@ drop
// Removes the top element from the stack
stack.pop();
//@ clear
// Removes all elements from the stack
while (!stack.empty()) {
    stack.pop();
}
//@ swap
// Switches the positions of the top two elements on the stack
const b = stack.pop();
const a = stack.pop();
stack.push(b);
stack.push(a);
//@ +
// Adds values element-wise
//  1 2 + => 3
//  [1 2] 3 + => [4 5]
//  [1 2] [3 4] => [4 6]
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
//@ -
// Subtracts values element-wise. See + for examples
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
//@ *
// Multiplies values element-wise. See + for examples
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
//@ /
// Divides values element-wise. See + for examples
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
//@ neg
// Negates values element-wise.
//  1 neg => -1
//  [1 -2 3] neg => [-1 2 -3]
const a = stack.pop();
let output = null;

if (stack.isList(a)) {
    output = a.map(x => -x);
} else {
    output = -a;
}

stack.push(output);
//@ empty
// Pushes an empty value to the stack
stack.push([]);
//@ @
// Concatenates the top two elements on the stack.
//   1 2 @ => [1 2]
//   [1 2] 3 @ => [1 2 3]
//   [1 2] [3 4] => [1 2 3 4]
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
//@ collect
// Combines all the elements together on the stack, as with @
//   1 2 3 4 5 collect => [1 2 3 4 5]
while (stack.depth() > 1) {
    stack.invoke('@');
}
//@ sum
// Sums the value of the topmost element on the stack.
//   1 sum => 1
//   [2 3 4] sum => 9
const a = stack.pop();
let output = null;

if (stack.isList(a)) {
    output = 0;
    a.forEach(x => output += x);
} else {
    output = a;
}

stack.push(output);
//@ product
// Multiplies the value of the topmost element on the stack.
//   1 product => 1
//   [2 3 4] product => 24
const a = stack.pop();
let output = null;

if (stack.isList(a)) {
    output = 1;
    a.forEach(x => output *= x);
} else {
    output = a;
}

stack.push(output);
//@ average
// Computes the mean of the topmost list on the stack.
//   [1 2 3] average => 2
[
    'dup',
    'sum',
    'swap',
    'count',
    '/'
].forEach(cmd => stack.invoke(cmd));
//@ count
// Counts the number of elements in the topmost value on the stack.
//   1 count => -1
//   [1 2 3] count => 3
const a = stack.pop();
let output = null;

if (stack.isList(a)) {
    output = a.length;
} else {
    output = -1;
}

stack.push(output);
