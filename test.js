
let text = "geeks";

let newtext = "";

for (let i = 0; i < text.length; i++) {
    let temp = String.fromCharCode(text.charCodeAt(i) + 2);
    newtext += temp;
}

console.log(newtext);

// const str = "hello world";
// console.log(str.substring(1, 4));

const str = "hello world";
console.log(str.indexOf("o", 5));