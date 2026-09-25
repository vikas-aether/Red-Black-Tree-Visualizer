// ============================================================
// RED-BLACK TREE VISUALIZER PRO
// ============================================================

let mode = "insert";

let frames = [];

let currentStep = 0;

let timer = null;

let treeScale = 1.0;


// ============================================================
// HELPER
// ============================================================

const $ = id => document.getElementById(id);


// ============================================================
// PARSE NUMBERS
// ============================================================

function numbers(text) {

    return String(text || "")
        .split(",")
        .map(x => Number(x.trim()))
        .filter(Number.isFinite);

}


// ============================================================
// DRAW TREE
// ============================================================

function drawTree(node, roles, parentKey = null) {

    if (!node) {

        return `
            <div class="nil">
                NIL
            </div>
        `;

    }


    let classes = "node " + String(node.color || "BLACK").toLowerCase();


    // ========================================================
    // ROLE HIGHLIGHTING
    // ========================================================

    for (
        const [role, value]
        of Object.entries(roles || {})
    ) {

        if (
            value !== null &&
            value !== undefined &&
            value === node.key
        ) {

            const className = {

                current: "current",

                parent: "parent",

                uncle: "uncle",

                sibling: "sibling",

                near: "near",

                far: "far"

            }[role];


            if (className) {

                classes += " " + className;

            }

        }

    }


    return `

        <div class="nodewrap">

            <div
                class="${classes}"
                data-key="${node.key}"
                data-parent="${parentKey !== null ? parentKey : ""}"
            >

                ${node.key}

            </div>


            <div class="children">

                <div class="child">

                    ${drawTree(
                        node.left,
                        roles,
                        node.key
                    )}

                </div>


                <div class="child">

                    ${drawTree(
                        node.right,
                        roles,
                        node.key
                    )}

                </div>

            </div>

        </div>

    `;

}


// ============================================================
// RENDER FRAME
// ============================================================

function renderFrame() {

    if (!frames.length) {

        const tree = $("tree");

        if (tree) {
            tree.innerHTML = "Start a simulation.";
        }

        const step = $("step");

        if (step) {
            step.textContent = "0 / 0";
        }

        return;

    }


    const frame = frames[currentStep];


    if (!frame) {
        return;
    }


    // ========================================================
    // STEP
    // ========================================================

    if ($("step")) {

        $("step").textContent =
            `${currentStep + 1} / ${frames.length}`;

    }


    // ========================================================
    // CASE
    // ========================================================

    if ($("case")) {

        $("case").textContent =
            frame.title || "Visualization";

    }


    // ========================================================
    // DETAIL
    // ========================================================

    if ($("detail")) {

        $("detail").textContent =
            frame.detail || "";

    }


    // ========================================================
    // ROLES
    // ========================================================

    const roles = frame.roles || {};


    if ($("role")) {

        $("role").textContent =

            Object.entries(roles)

                .filter(
                    item =>
                        item[1] !== null &&
                        item[1] !== undefined
                )

                .map(
                    item =>
                        `${item[0]} = ${item[1]}`
                )

                .join(" • ") || "—";

    }


    // ========================================================
    // TREE
    // ========================================================

    if ($("tree")) {

        $("tree").innerHTML =

            drawTree(

                frame.tree,

                $("roles") && $("roles").checked
                    ? roles
                    : {}

            );

    }


    // ========================================================
    // ARROW
    // ========================================================

    if (
        $("arrows") &&
        $("arrows").checked &&
        frame.arrow
    ) {

        const arrow =
            document.createElement("div");


        arrow.className =
            "arrow " + frame.arrow;


        arrow.textContent =

            frame.arrow === "left"

                ? "↶ LEFT ROTATE"

                : "↷ RIGHT ROTATE";


        if ($("tree")) {

            $("tree").appendChild(arrow);

        }

    }


    // ========================================================
    // DRAW CONNECTIONS
    // ========================================================

    setTimeout(() => {

        drawConnections();

    }, 50);

}


// ============================================================
// RUN SIMULATION
// ============================================================

async function runSimulation() {

    stopPlay();


    // ========================================================
    // GET KEYS
    // ========================================================

    const keyValues =
        numbers(
            $("keys")?.value || ""
        );


    // ========================================================
    // VALIDATION
    // ========================================================

    if (!keyValues.length) {

        alert(
            mode === "delete"
                ? "Please enter values to delete."
                : "Please enter values for insertion."
        );

        $("keys")?.focus();

        return;

    }


    // ========================================================
    // DATA
    // ========================================================

    const data = {

        operation: mode,

        keys: keyValues

    };


    // ========================================================
    // DELETE MODE
    // ========================================================

    if (mode === "delete") {

        const initialValues =
            numbers(
                $("initial")?.value || ""
            );


        if (!initialValues.length) {

            alert(
                "Please enter the Initial Tree values."
            );

            $("initial")?.focus();

            return;

        }


        data.initial = initialValues;

    }


    // ========================================================
    // LOADING STATE
    // ========================================================

    if ($("start")) {

        $("start").disabled = true;

        $("start").textContent =
            "Running...";

    }


    try {

        // ====================================================
        // API REQUEST
        // ====================================================

        const response =
            await fetch(
                "/api/simulate",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(data)

                }
            );


        // ====================================================
        // RESPONSE
        // ====================================================

        let result;

        try {

            result =
                await response.json();

        } catch (error) {

            throw new Error(
                "Server returned an invalid response."
            );

        }


        // ====================================================
        // API ERROR
        // ====================================================

        if (!response.ok) {

            throw new Error(
                result.error ||
                result.message ||
                `Server error: ${response.status}`
            );

        }


        // ====================================================
        // STEPS
        // ====================================================

        if (!Array.isArray(result.steps)) {

            throw new Error(
                "No simulation steps were returned."
            );

        }


        frames =
            result.steps

                .flatMap(
                    item =>
                        Array.isArray(item.frames)
                            ? item.frames
                            : []
                );


        // ====================================================
        // RESET STEP
        // ====================================================

        currentStep = 0;


        // ====================================================
        // STATS
        // ====================================================

        if ($("nodes")) {

            $("nodes").textContent =
                result.node_count ?? 0;

        }


        if ($("height")) {

            $("height").textContent =
                result.height ?? 0;

        }


        if ($("red")) {

            $("red").textContent =
                result.red_nodes ?? 0;

        }


        if ($("black")) {

            $("black").textContent =
                result.black_nodes ?? 0;

        }


        // ====================================================
        // IN-ORDER
        // ====================================================

        if ($("order")) {

            $("order").textContent =

                Array.isArray(result.inorder) &&
                result.inorder.length

                    ? result.inorder.join(" → ")

                    : "—";

        }


        // ====================================================
        // VALID
        // ====================================================

        if ($("valid")) {

            $("valid").textContent =

                result.valid

                    ? "✓ Valid Red-Black Tree"

                    : "✗ Invalid";

        }


        // ====================================================
        // RENDER
        // ====================================================

        renderFrame();


    } catch (error) {

        console.error(
            "Simulation error:",
            error
        );


        alert(
            error?.message ||
            "Something went wrong while running the simulation."
        );

    } finally {

        // ====================================================
        // RESTORE BUTTON
        // ====================================================

        if ($("start")) {

            $("start").disabled = false;

            $("start").textContent =
                "Start Visualization";

        }

    }

}


// ============================================================
// PLAY
// ============================================================

function play() {

    if (!frames.length) {

        alert(
            "Please start a simulation first."
        );

        return;

    }


    if (timer) {

        stopPlay();

        return;

    }


    if ($("play")) {

        $("play").textContent =
            "⏸ Pause";

    }


    timer = setInterval(

        () => {

            if (
                currentStep >=
                frames.length - 1
            ) {

                stopPlay();

                return;

            }


            currentStep++;

            renderFrame();

        },

        Number(
            $("speed")?.value || 900
        )

    );

}


// ============================================================
// STOP PLAY
// ============================================================

function stopPlay() {

    if (timer) {

        clearInterval(timer);

        timer = null;

    }


    if ($("play")) {

        $("play").textContent =
            "▶ Play";

    }

}


// ============================================================
// PREVIOUS
// ============================================================

$("previous")?.addEventListener(
    "click",
    () => {

        if (!frames.length) {
            return;
        }


        currentStep =

            Math.max(

                0,

                currentStep - 1

            );


        renderFrame();

    }
);


// ============================================================
// NEXT
// ============================================================

$("next")?.addEventListener(
    "click",
    () => {

        if (!frames.length) {
            return;
        }


        currentStep =

            Math.min(

                frames.length - 1,

                currentStep + 1

            );


        renderFrame();

    }
);


// ============================================================
// PLAY BUTTON
// ============================================================

$("play")?.addEventListener(
    "click",
    play
);


// ============================================================
// START BUTTON
// ============================================================

$("start")?.addEventListener(
    "click",
    runSimulation
);


// ============================================================
// INSERT MODE
// ============================================================

$("insertMode")?.addEventListener(
    "click",
    () => {

        stopPlay();


        mode = "insert";


        // ----------------------------------------------------
        // ACTIVE BUTTON
        // ----------------------------------------------------

        $("insertMode")
            ?.classList
            .add("active");


        $("deleteMode")
            ?.classList
            .remove("active");


        // ----------------------------------------------------
        // HIDE INITIAL TREE
        // ----------------------------------------------------

        if ($("initialBox")) {

            $("initialBox")
                .style
                .display = "none";

        }


        // ----------------------------------------------------
        // HEADING
        // ----------------------------------------------------

        if ($("heading")) {

            $("heading").textContent =
                "Insertion Visualization";

        }


        // ----------------------------------------------------
        // PLACEHOLDER ONLY
        // IMPORTANT:
        // DO NOT PUT VALUE HERE
        // ----------------------------------------------------

        if ($("keys")) {

            $("keys").placeholder =
                "example=41,38,31,12,19,8";

        }

    }
);


// ============================================================
// DELETE MODE
// ============================================================

$("deleteMode")?.addEventListener(
    "click",
    () => {

        stopPlay();


        mode = "delete";


        // ----------------------------------------------------
        // ACTIVE BUTTON
        // ----------------------------------------------------

        $("deleteMode")
            ?.classList
            .add("active");


        $("insertMode")
            ?.classList
            .remove("active");


        // ----------------------------------------------------
        // SHOW INITIAL TREE
        // ----------------------------------------------------

        if ($("initialBox")) {

            $("initialBox")
                .style
                .display = "block";

        }


        // ----------------------------------------------------
        // HEADING
        // ----------------------------------------------------

        if ($("heading")) {

            $("heading").textContent =
                "Deletion Visualization";

        }


        // ----------------------------------------------------
        // PLACEHOLDER ONLY
        // ----------------------------------------------------

        if ($("keys")) {

            $("keys").placeholder =
                "example=41,19,8,12,31,38";

        }


        if ($("initial")) {

            $("initial").placeholder =
                "example=41,38,31,12,19,8";

        }

    }
);

// ============================================================
// CLRS DEMO
// ============================================================

$("clrs")?.addEventListener(
    "click",
    async () => {

        // Stop any running animation
        stopPlay();

        // ====================================================
        // INSERTION CLRS DEMO
        // ====================================================

        if (mode === "insert") {

            // Make sure insertion UI is active
            $("insertMode")?.classList.add("active");
            $("deleteMode")?.classList.remove("active");

            if ($("initialBox")) {
                $("initialBox").style.display = "none";
            }

            if ($("heading")) {
                $("heading").textContent =
                    "Insertion Visualization";
            }

            // Actual CLRS insertion sequence
            if ($("keys")) {
                $("keys").placeholder =
                    "41,38,31,12,19,8";

                $("keys").placeholder =
                    "example=41,38,31,12,19,8";
            }

            // Run demo
            await runSimulation();

            return;
        }


        // ====================================================
        // DELETION CLRS DEMO
        // ====================================================

        if (mode === "delete") {

            // Make sure deletion UI is active
            $("deleteMode")?.classList.add("active");
            $("insertMode")?.classList.remove("active");

            if ($("initialBox")) {
                $("initialBox").style.display = "block";
            }

            if ($("heading")) {
                $("heading").textContent =
                    "Deletion Visualization";
            }

            // Initial tree
            if ($("initial")) {
                $("initial").placeholder =
                    "41,38,31,12,19,8";

                $("initial").placeholder =
                    "example=41,38,31,12,19,8";
            }

            // Values to delete
            if ($("keys")) {
                $("keys").placeholder =
                    "41,38,31,12,19,8";

                $("keys").placeholder =
                    "example=41,38,31,12,19,8";
            }

            // Run deletion demo
            await runSimulation();

        }

    }
);


// ============================================================
// CLEAR KEYS BUTTON
// ============================================================

$("clearKeys")?.addEventListener(
    "click",
    () => {

        if ($("keys")) {

            $("keys").value = "";

            $("keys").focus();

        }

    }
);


// ============================================================
// CLEAR INITIAL TREE BUTTON
// ============================================================

$("clearInitial")?.addEventListener(
    "click",
    () => {

        if ($("initial")) {

            $("initial").value = "";

            $("initial").focus();

        }

    }
);


// ============================================================
// INITIAL
// ============================================================

renderFrame();


// ============================================================
// DRAW PARENT → CHILD CONNECTIONS
// ============================================================

function drawConnections() {

    const svg =
        document.getElementById(
            "treeConnections"
        );


    const canvas =
        document.getElementById(
            "treeCanvas"
        );


    if (!svg || !canvas) {

        return;

    }


    svg.innerHTML = "";


    const canvasRect =
        canvas.getBoundingClientRect();


    const nodes =
        document.querySelectorAll(
            "#tree .node[data-key]"
        );


    nodes.forEach(parent => {

        const parentKey =
            parent.dataset.key;


        const children =
            document.querySelectorAll(
                `#tree .node[data-parent="${parentKey}"]`
            );


        children.forEach(child => {

            const p =
                parent.getBoundingClientRect();


            const c =
                child.getBoundingClientRect();


            const x1 =
                p.left +
                p.width / 2 -
                canvasRect.left;


            const y1 =
                p.bottom -
                canvasRect.top;


            const x2 =
                c.left +
                c.width / 2 -
                canvasRect.left;


            const y2 =
                c.top -
                canvasRect.top;


            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );


            line.setAttribute(
                "x1",
                x1
            );


            line.setAttribute(
                "y1",
                y1
            );


            line.setAttribute(
                "x2",
                x2
            );


            line.setAttribute(
                "y2",
                y2
            );


            line.classList.add(
                "tree-edge"
            );


            svg.appendChild(line);

        });

    });

}


// ============================================================
// TREE SIZE CONTROL
// ============================================================

function updateTreeSize() {

    const tree =
        document.getElementById(
            "tree"
        );


    const svg =
        document.getElementById(
            "treeConnections"
        );


    const value =
        document.getElementById(
            "treeSizeValue"
        );


    if (!tree) {

        return;

    }


    // --------------------------------------------------------
    // SCALE TREE
    // --------------------------------------------------------

    tree.style.transform =
        `scale(${treeScale})`;


    tree.style.transformOrigin =
        "top center";


    // --------------------------------------------------------
    // DISPLAY PERCENTAGE
    // --------------------------------------------------------

    if (value) {

        value.textContent =
            Math.round(treeScale * 100) + "%";

    }


    // --------------------------------------------------------
    // REDRAW CONNECTIONS
    // --------------------------------------------------------

    setTimeout(
        () => {

            drawConnections();

        },
        100
    );

}


// ============================================================
// SMALL
// ============================================================

$("treeSmall")?.addEventListener(
    "click",
    () => {

        if (treeScale > 0.5) {

            treeScale -= 0.1;

            treeScale =
                Math.round(treeScale * 10) / 10;

            updateTreeSize();

        }

    }
);


// ============================================================
// LARGE
// ============================================================

$("treeLarge")?.addEventListener(
    "click",
    () => {

        if (treeScale < 1.5) {

            treeScale += 0.1;

            treeScale =
                Math.round(treeScale * 10) / 10;

            updateTreeSize();

        }

    }
);


// ============================================================
// REDRAW ON WINDOW RESIZE
// ============================================================

window.addEventListener(
    "resize",
    () => {

        setTimeout(
            drawConnections,
            50
        );

    }
);


// ============================================================
// REDRAW AFTER SCROLL
// ============================================================

$("treeCanvas")?.addEventListener(
    "scroll",
    () => {

        drawConnections();

    }
);

// ============================================================
// RESET ALL INPUT VALUES
// ============================================================

$("resetValues")?.addEventListener(
    "click",
    () => {

        // Stop animation
        stopPlay();

        // Clear Keys
        if ($("keys")) {
            $("keys").value = "";
        }

        // Clear Initial Tree
        if ($("initial")) {
            $("initial").value = "";
        }

        // Clear previous simulation
        frames = [];
        currentStep = 0;

        // Reset step
        if ($("step")) {
            $("step").textContent = "0 / 0";
        }

        // Reset inspector
        if ($("case")) {
            $("case").textContent = "Ready";
        }

        if ($("detail")) {
            $("detail").textContent =
                "Enter values and start a simulation.";
        }

        if ($("role")) {
            $("role").textContent = "—";
        }

        if ($("nodes")) {
            $("nodes").textContent = "0";
        }

        if ($("height")) {
            $("height").textContent = "0";
        }

        if ($("red")) {
            $("red").textContent = "0";
        }

        if ($("black")) {
            $("black").textContent = "0";
        }

        if ($("valid")) {
            $("valid").textContent = "—";
        }

        if ($("order")) {
            $("order").textContent = "—";
        }

        // Reset tree display
        if ($("tree")) {
            $("tree").innerHTML =
                "Start a simulation.";
        }

        // Redraw connections
        drawConnections();

    }
);


// ============================================================
// INITIAL TREE SIZE
// ============================================================

updateTreeSize();