"use strict";

// ПР1, задание 2. Значение выражения и тип результата выводятся в одной строке.
// Для 9 и 10 отдельно показан тип самого результата typeof (это всегда строка).

console.log("[1]  \"8\" + 2          ->", JSON.stringify("8" + 2), "/", typeof ("8" + 2));
console.log("[2]  \"8\" - 2          ->", "8" - 2, "/", typeof ("8" - 2));
console.log("[3]  Number(\"8\") + 2  ->", Number("8") + 2, "/", typeof (Number("8") + 2));
console.log("[4]  \"12\" > \"3\"       ->", "12" > "3", "/", typeof ("12" > "3"));
console.log("[5]  12 === \"12\"      ->", 12 === "12", "/", typeof (12 === "12"));
console.log("[6]  Number(\"\")       ->", Number(""), "/", typeof Number(""));
console.log("[7]  Number(\"text\")   ->", Number("text"), "/", typeof Number("text"));
console.log("[8]  Boolean(\"false\") ->", Boolean("false"), "/", typeof Boolean("false"));

const typeOfNull = typeof null;
const typeOfNaN = typeof NaN;
console.log("[9]  typeof null      ->", JSON.stringify(typeOfNull), "/", typeof typeOfNull);
console.log("[10] typeof NaN       ->", JSON.stringify(typeOfNaN), "/", typeof typeOfNaN);
