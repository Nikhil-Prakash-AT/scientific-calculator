const result = document.getElementById("result");
const expandBtn = document.getElementById("expandBtn");
const scientificPanel = document.getElementById("scientificPanel");
const themeBtn = document.getElementById("themeBtn");
const degBtn = document.getElementById("degBtn");
const preview = document.getElementById("preview");

/* History */
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const historyBtn = document.getElementById("historyBtn");

/* Converter */
const converterPanel = document.getElementById("converterPanel");
const converterBtn = document.getElementById("converterBtn");
const category = document.getElementById("category");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");
const convertValueInput = document.getElementById("convertValue");
const convertResult = document.getElementById("convertResult");

/* STATE */
let expanded = false;
let degMode = true;
let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

/* SAFE EVALUATOR */
function evaluateExpression(expr) {
  if (!expr) throw "Empty";

  let e = expr
    .replace(/π/g, Math.PI)
    .replace(/\be\b/g, Math.E)
    .replace(/\^/g, "**");

  e = e.replace(/sin\(/g, degMode ? "Math.sin(Math.PI/180*" : "Math.sin(");
  e = e.replace(/cos\(/g, degMode ? "Math.cos(Math.PI/180*" : "Math.cos(");
  e = e.replace(/tan\(/g, degMode ? "Math.tan(Math.PI/180*" : "Math.tan(");

  e = e.replace(/log\(/g, "Math.log10(");
  e = e.replace(/ln\(/g, "Math.log(");

  const val = Function(`return (${e})`)();
  if (!isFinite(val)) throw "Invalid";
  return val;
}

/* INPUT */
function appendValue(v) {
  if (result.value === "Error") {
    result.value = "";
    preview.textContent = "";
  }
  result.value += v;
  updatePreview();
}

function clearDisplay() {
  result.value = "";
  preview.textContent = "";
}

function deleteChar() {
  if (result.value === "Error") {
    clearDisplay();
    return;
  }
  result.value = result.value.slice(0, -1);
  updatePreview();
}

/* PREVIEW */
function updatePreview() {
  if (!result.value) {
    preview.textContent = "";
    return;
  }
  try {
    preview.textContent = "= " + evaluateExpression(result.value);
  } catch {
    preview.textContent = "";
  }
}

/* CALCULATE */
function calculateResult() {
  try {
    const value = evaluateExpression(result.value);
    addToHistory(result.value, value);
    result.value = value;
    preview.textContent = "";
  } catch {
    result.value = "Error";
    preview.textContent = "";
  }
}

/* HISTORY */
function addToHistory(expression, value) {
  history.unshift({ expression, value });
  if (history.length > 10) history.pop();
  localStorage.setItem("calcHistory", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.expression} = ${item.value}`;
    li.onclick = () => {
      result.value = item.value;
      preview.textContent = "";
    };
    historyList.appendChild(li);
  });
}
renderHistory();

historyBtn.addEventListener("click", () => {
  historyPanel.classList.toggle("active");
  historyBtn.textContent = historyPanel.classList.contains("active") ? "❌" : "📜";
});

/* SCIENTIFIC */
function insertTrig(fn) {
  appendValue(fn + "(");
}

function sqrt() {
  appendValue("Math.sqrt(");
}

function power() {
  appendValue("^");
}

function factorial() {
  try {
    const n = evaluateExpression(result.value);
    if (n < 0 || n % 1 !== 0) throw "";
    let r = 1;
    for (let i = 1; i <= n; i++) r *= i;
    addToHistory(`${n}!`, r);
    result.value = r;
  } catch {
    result.value = "Error";
  }
}

function insertValue(v) {
  appendValue(v);
}

function toggleDegRad() {
  degMode = !degMode;
  degBtn.textContent = degMode ? "Deg" : "Rad";
}

/* SCI PANEL */
expandBtn.addEventListener("click", () => {
  expanded = !expanded;
  scientificPanel.classList.toggle("active");
  expandBtn.textContent = expanded ? "⮞" : "⮜";
});

/* THEME */
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  themeBtn.textContent = "🌞";
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  themeBtn.textContent =
    document.body.classList.contains("light-mode") ? "🌞" : "🌙";
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );
});

/* KEYBOARD */
document.addEventListener("keydown", e => {
  if (result.value === "Error") clearDisplay();
  if (!isNaN(e.key) || "+-*/().%^".includes(e.key)) appendValue(e.key);
  else if (e.key === "Enter") calculateResult();
  else if (e.key === "Backspace") deleteChar();
});

/* CONVERTER */
const units = {
  length: ["Millimetre","Centimetre","Metre","Kilometre","Inch","Foot","Yard","Mile","Nautical mile"],
  weight: ["Milligram","Gram","Kilogram","Tonne","Ounce","Pound","Stone","US ton","Imperial ton"],
  temperature: ["Celsius","Fahrenheit","Kelvin"]
};

const lengthRates = {
  Millimetre:0.001, Centimetre:0.01, Metre:1, Kilometre:1000,
  Inch:0.0254, Foot:0.3048, Yard:0.9144, Mile:1609.34, "Nautical mile":1852
};

const weightRates = {
  Milligram:0.000001, Gram:0.001, Kilogram:1, Tonne:1000,
  Ounce:0.0283495, Pound:0.453592, Stone:6.35029, "US ton":907.185, "Imperial ton":1016.05
};

function populateUnits() {
  const c = category.value;
  fromUnit.innerHTML = units[c].map(u => `<option>${u}</option>`).join("");
  toUnit.innerHTML = fromUnit.innerHTML;
}
populateUnits();
category.addEventListener("change", populateUnits);

function convertValue() {
  const v = parseFloat(convertValueInput.value);
  if (isNaN(v)) return convertResult.textContent = "Enter a valid number";
  let r;

  if (category.value === "length")
    r = v * (lengthRates[fromUnit.value] / lengthRates[toUnit.value]);
  else if (category.value === "weight")
    r = v * (weightRates[fromUnit.value] / weightRates[toUnit.value]);
  else {
    if (fromUnit.value === "Celsius" && toUnit.value === "Fahrenheit") r = v*9/5+32;
    else if (fromUnit.value === "Fahrenheit" && toUnit.value === "Celsius") r = (v-32)*5/9;
    else if (fromUnit.value === "Celsius" && toUnit.value === "Kelvin") r = v+273.15;
    else if (fromUnit.value === "Kelvin" && toUnit.value === "Celsius") r = v-273.15;
    else if (fromUnit.value === "Fahrenheit" && toUnit.value === "Kelvin") r = (v-32)*5/9+273.15;
    else if (fromUnit.value === "Kelvin" && toUnit.value === "Fahrenheit") r = (v-273.15)*9/5+32;
    else r = v;
  }

  convertResult.textContent = `${v} ${fromUnit.value} = ${r.toFixed(4)} ${toUnit.value}`;
}

converterBtn.addEventListener("click", () => {
  converterPanel.classList.toggle("active");
  converterBtn.textContent = converterPanel.classList.contains("active") ? "⮜" : "↔";
});
