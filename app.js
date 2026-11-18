const architectureStages = [
  { from: "Asm", to: "Mach", kind: "validated", recovery: "Instruction expansion", evidence: "Asmgen validator", description: "Recovers the Mach instruction encoded by each expanded assembly sequence, then validates the regenerated Asm program." },
  { from: "Mach", to: "Linear", kind: "validated", recovery: "Stack abstractions", evidence: "Stacking validator", description: "Recovers abstract stack slots, frame size, and callee-save structure from concrete Mach stack offsets." },
  { from: "Linear", to: "LTL", kind: "verified", recovery: "Control-flow graph", evidence: "Rocq simulation theorem", description: "Turns labels, branches, and linear fall-through into an explicit graph with proved state correspondence." },
  { from: "LTL", to: "RTL", kind: "validated", recovery: "Pseudo-registers", evidence: "Allocation validator", description: "Reconstructs virtual registers from machine locations while preserving moves, live ranges, calls, and split values." },
  { from: "RTL", to: "CminorSel", kind: "verified", recovery: "Selected expressions", evidence: "Rocq simulation theorem", description: "Lifts one-instruction CFG nodes into CminorSel expressions and statements, retaining explicit control flow." },
  { from: "CminorSel", to: "Cminor", kind: "verified", recovery: "Portable statements", evidence: "Rocq simulation theorem", description: "Reconstructs Cminor expressions and statements while accounting for silent setup and bookkeeping steps." },
  { from: "Cminor", to: "Csharpminor", kind: "validated", recovery: "Types and layouts", evidence: "Cminorgen validator", description: "Proposes addressable variables, aggregate layouts, and source types, then validates by recompilation." },
  { from: "Csharpminor", to: "Clight", kind: "validated", recovery: "C statements", evidence: "Cshmgen validator", description: "Recovers Clight declarations and structured expression forms under a proved whole-program validator." },
  { from: "Clight", to: "Csyntax", kind: "validated", recovery: "Readable C syntax", evidence: "SimplExpr + SimplLocals", description: "Produces printable CompCert Csyntax and checks it through CompCert's source simplification passes." },
];

const sampleStages = [
  {
    id: "expanded-asm", name: "Expanded assembly", assurance: "trusted-front-end",
    evidence: "CompCert assembly printer · add_call.c bundle excerpt",
    content: `_add:\n  mov  x15, sp\n  stp  x15, x30, [sp, #-16]!\n  add  w0, w0, w1\n  ldr  x30, [sp, #8]\n  add  sp, sp, #16\n  ret  x30\n\n_main:\n  mov  x15, sp\n  stp  x15, x30, [sp, #-16]!\n  orr  w0, wzr, #3\n  orr  w1, wzr, #4\n  bl   _add\n  ldr  x30, [sp, #8]\n  add  sp, sp, #16\n  ret  x30`,
  },
  {
    id: "unexpanded-asm", name: "Unexpanded Asm", assurance: "trusted-front-end",
    evidence: "Asmgen output before expansion · runtime declarations omitted",
    content: `function add {\n  0: Pallocframe\n  1: Pcfi_rel_offset\n  2: Padd\n  3: Pldrx\n  4: Pfreeframe\n  5: Pret\n}\n\nfunction main {\n  0: Pallocframe\n  1: Pcfi_rel_offset\n  2: Porrimm(W,#3)\n  3: Porrimm(W,#4)\n  4: Pbl\n  5: Pldrx\n  6: Pfreeframe\n  7: Pret\n}`,
  },
  {
    id: "mach", name: "Mach", assurance: "translation-validation",
    evidence: "proved Asmgen validator",
    content: `add() {\n  X0 = X0 + X1\n  return\n}\n\nmain() {\n  X0 = 3\n  X1 = 4\n  call \"add\" : [int,int]->int\n  return\n}`,
  },
  {
    id: "linear", name: "Linear", assurance: "translation-validation",
    evidence: "proved Stacking validator",
    content: `add() {\n  X0 = X0 + X1\n  return\n}\n\nmain() {\n  X0 = 3\n  X1 = 4\n  call \"add\" : [int,int]->int\n  return\n}`,
  },
  {
    id: "ltl", name: "LTL", assurance: "verified-transformation",
    evidence: "Rocq simulation theorem",
    content: `add() {\n  6: goto 1\n  5:\n  4: return\n  3: goto 4\n  2: X0 = X0 + X1; goto 3\n  1: goto 2\n}\n\nmain() {\n  10: goto 1\n   9:\n   8: return\n   7: goto 8\n   6: call \"add\"; goto 7\n   5: goto 6\n   4: X1 = 4; goto 5\n   3: goto 4\n   2: X0 = 3; goto 3\n   1: goto 2\n}`,
  },
  {
    id: "rtl", name: "RTL", assurance: "translation-validation",
    evidence: "proved allocation validator",
    content: `add(x61, x62) {\n  goto 3\n  4: nop\n  3: x65 = x61 + x62\n  2: nop\n  1: return x65\n}\n\nmain() {\n  goto 6\n  7: nop\n  6: x262 = 3\n  5: x263 = 4\n  4: x307 = \"add\"(x262, x263)\n  3: nop\n  2: nop\n  1: return x307\n}`,
  },
  {
    id: "cminorsel", name: "CminorSel", assurance: "verified-transformation",
    evidence: "Rocq simulation theorem",
    content: `\"add\"(x2, x1) : int -> int -> int {\n  stack 0;\n  locals [x4, x3];\n  goto L3;\nL2:\n  x4 = (x3);\n  goto L1;\nL1:\n  return x4;\nL3:\n  x3 = (x2 + x1);\n  goto L2;\n}\n\n\"main\"() : int {\n  stack 0;\n  locals [x4, x5, x3, x2, x1];\n  goto L7;\nL4: x2 = (x1); goto L3;\nL2: x3 = (0); goto L1;\nL6: x5 = (4); goto L5;\nL1: return x3;\nL5: x1 = call \"add\"(x4, x5); goto L4;\nL3: x3 = (x2); goto L1;\nL7: x4 = (3); goto L6;\n}`,
  },
  {
    id: "cminor", name: "Cminor", assurance: "verified-transformation",
    evidence: "Rocq simulation theorem",
    content: `\"add\"(x, y) : int -> int -> int\n{\n  var z;\n  z = x + y;\n  return z;\n}\n\n\"main\"() : int\n{\n  var z, $60;\n  $60 = \"add\"(3, 4) : int -> int -> int;\n  z = $60;\n  return z;\n  return 0;\n}`,
  },
  {
    id: "csharpminor", name: "Csharpminor", assurance: "translation-validation",
    evidence: "proved Cminorgen validator",
    content: `\"add\"(x, y) : int -> int -> int {\n  temp z;\n  skip;\n  z = (x + y);\n  skip;\n  return z;\n}\n\n\"main\"() : int {\n  temp z, $60;\n  skip;\n  $60 = &add(3, 4) : int -> int -> int;\n  z = $60;\n  skip;\n  return z;\n  skip;\n  return 0;\n}`,
  },
  {
    id: "clight", name: "Clight", assurance: "translation-validation",
    evidence: "proved Cshmgen validator · redundant prototypes omitted",
    content: `int add(int x, int y)\n{\n  register int $z;\n  $z = $x + $y;\n  return $z;\n}\n\nint main(void)\n{\n  register int $z;\n  register int $60;\n  $60 = &add(3, 4);\n  $z = $60;\n  return $z;\n  return 0;\n}`,
  },
  {
    id: "readable-c", name: "Readable C", assurance: "translation-validation",
    evidence: "proved SimplExpr validator · redundant prototypes omitted",
    content: `int add(int x, int y)\n{\n  int z;\n  z = x + y;\n  return z;\n}\n\nint main(void)\n{\n  int z;\n  z = add(3, 4);\n  return z;\n  return 0;\n}`,
  },
];

const pipeline = document.querySelector("#architecture-pipeline");
const stageDetail = document.querySelector("#stage-detail");

function architectureButton(stage, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pipeline-stage";
  button.dataset.kind = stage.kind;
  button.setAttribute("role", "listitem");
  button.innerHTML = `
    <span class="stage-number">${String(index + 1).padStart(2, "0")}</span>
    <strong>${stage.from}<br>→ ${stage.to}</strong>
    <span class="stage-kind"><i></i>${stage.kind === "verified" ? "Verified" : "Validated"}</span>`;
  button.addEventListener("click", () => showArchitectureStage(index));
  return button;
}

function showArchitectureStage(index) {
  const stage = architectureStages[index];
  pipeline.querySelectorAll(".pipeline-stage").forEach((element, current) => {
    element.classList.toggle("active", current === index);
  });
  const label = stage.kind === "verified" ? "Directly verified in Rocq" : "Translation validation";
  stageDetail.innerHTML = `
    <div><small>REVERSE BOUNDARY</small><h3>${stage.from} → ${stage.to}</h3></div>
    <div><small>RECONSTRUCTS</small><h3>${stage.recovery}</h3><p>${stage.description}</p></div>
    <div><span class="assurance-pill ${stage.kind === "validated" ? "validated" : ""}">✓ ${label}</span><p>${stage.evidence}</p></div>`;
}

architectureStages.forEach((stage, index) => pipeline.append(architectureButton(stage, index)));
showArchitectureStage(0);

let explorerStages = sampleStages;
let explorerIndex = explorerStages.length - 1;
const tabs = document.querySelector("#explorer-tabs");
const previousTitle = document.querySelector("#previous-title");
const currentTitle = document.querySelector("#current-title");
const previousCode = document.querySelector("#previous-code");
const currentCode = document.querySelector("#current-code");
const previousBadge = document.querySelector("#previous-badge");
const currentBadge = document.querySelector("#current-badge");
const evidence = document.querySelector("#stage-evidence");
const bundleMessage = document.querySelector("#bundle-message");
const resetExample = document.querySelector("#reset-sample");

function assurance(stage) {
  if (stage.assurance === "verified-transformation") return { label: "Verified", className: "" };
  if (stage.assurance === "translation-validation") return { label: "Validated", className: "validated" };
  return { label: "Trusted front end", className: "frontend" };
}

function badge(stage) {
  const value = assurance(stage);
  return `<span class="assurance-badge ${value.className}">${value.label}</span>`;
}

function showExplorerStage(index) {
  explorerIndex = index;
  const selected = explorerStages[index];
  const previous = explorerStages[Math.max(0, index - 1)];
  tabs.querySelectorAll(".stage-tab").forEach((tab, current) => {
    tab.classList.toggle("active", current === index);
    tab.setAttribute("aria-selected", String(current === index));
  });
  previousTitle.textContent = previous.name;
  currentTitle.textContent = selected.name;
  previousCode.textContent = previous.content;
  currentCode.textContent = selected.content;
  previousBadge.innerHTML = badge(previous);
  currentBadge.innerHTML = badge(selected);
  evidence.textContent = selected.evidence;
}

function renderExplorer() {
  tabs.replaceChildren();
  explorerStages.forEach((stage, index) => {
    const value = assurance(stage);
    const button = document.createElement("button");
    button.type = "button";
    button.role = "tab";
    button.className = `stage-tab ${value.className}`;
    button.innerHTML = `<span></span>${stage.name}`;
    button.addEventListener("click", () => showExplorerStage(index));
    tabs.append(button);
  });
  showExplorerStage(Math.min(explorerIndex, explorerStages.length - 1));
}

function showMessage(text, error = false) {
  bundleMessage.textContent = text;
  bundleMessage.classList.toggle("error", error);
  bundleMessage.hidden = false;
}

function clearMessage() {
  bundleMessage.hidden = true;
  bundleMessage.classList.remove("error");
}

async function openBundle(fileList) {
  clearMessage();
  const files = Array.from(fileList);
  const manifestFile = files.find(file => file.name === "manifest.json");
  if (!manifestFile) throw new Error("This folder does not contain a DeCompCert manifest.json file.");
  const manifest = JSON.parse(await manifestFile.text());
  if (!Array.isArray(manifest.stages)) throw new Error("The selected manifest does not contain DeCompCert stages.");
  const byRelativePath = new Map();
  const byName = new Map();
  files.forEach(file => {
    byRelativePath.set(file.webkitRelativePath, file);
    byName.set(file.name, file);
  });
  const loaded = [];
  for (const stage of manifest.stages) {
    const file = byName.get(stage.file)
      ?? Array.from(byRelativePath.entries()).find(([path]) => path.endsWith(`/${stage.file}`))?.[1];
    if (!file) continue;
    if (file.size > 2 * 1024 * 1024) throw new Error(`${stage.file} is larger than the 2 MiB viewer limit.`);
    loaded.push({ ...stage, content: await file.text() });
  }
  if (loaded.length < 2) throw new Error("The folder does not contain enough stage files to compare.");
  explorerStages = loaded;
  explorerIndex = loaded.length - 1;
  document.querySelector("#bundle-label").textContent = manifest.source ? `LOCAL BUNDLE · ${manifest.source.split(/[\\/]/).pop()}` : "LOCAL BUNDLE";
  document.querySelector("#bundle-target").textContent = [manifest.architecture, manifest.abi].filter(Boolean).join(" · ") || "DeCompCert bundle";
  resetExample.hidden = false;
  renderExplorer();
  showMessage(`Opened ${loaded.length} local stages. No files were uploaded.`);
}

document.querySelector("#bundle-input").addEventListener("change", async event => {
  try {
    await openBundle(event.target.files);
  } catch (error) {
    showMessage(error instanceof Error ? error.message : String(error), true);
  } finally {
    event.target.value = "";
  }
});

resetExample.addEventListener("click", () => {
  explorerStages = sampleStages;
  explorerIndex = sampleStages.length - 1;
  document.querySelector("#bundle-label").textContent = "SAMPLE";
  document.querySelector("#bundle-target").textContent = "AArch64 · Apple ABI";
  resetExample.hidden = true;
  clearMessage();
  renderExplorer();
});

document.querySelector("#copy-code").addEventListener("click", async event => {
  try {
    await navigator.clipboard.writeText(explorerStages[explorerIndex].content);
    const original = event.currentTarget.textContent;
    event.currentTarget.textContent = "Copied";
    setTimeout(() => { event.currentTarget.textContent = original; }, 1200);
  } catch {
    showMessage("Your browser did not allow clipboard access. Select the code manually instead.", true);
  }
});

renderExplorer();

const header = document.querySelector("[data-header]");
const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 16);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 })
  : null;

document.querySelectorAll(".reveal").forEach(element => {
  if (revealObserver) revealObserver.observe(element);
  else element.classList.add("visible");
});
