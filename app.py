
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

RED = "RED"
BLACK = "BLACK"


class Node:

    def __init__(self, key=None, color=BLACK):
        self.key = key
        self.color = color

        self.left = None
        self.right = None
        self.parent = None


class RBTree:

    def __init__(self):

        self.NIL = Node(None, BLACK)

        self.NIL.left = self.NIL
        self.NIL.right = self.NIL
        self.NIL.parent = self.NIL

        self.root = self.NIL

        self.frames = []


    # ------------------------------------------------
    # CREATE TREE SNAPSHOT
    # ------------------------------------------------

    def snapshot(self):

        def convert(node):

            if node is self.NIL:
                return None

            return {
                "key": node.key,
                "color": node.color,

                # Parent information
                "parent": (
                    node.parent.key
                    if node.parent is not self.NIL
                    else None
                ),

                "left": convert(node.left),
                "right": convert(node.right)
            }

        return convert(self.root)


    # ------------------------------------------------
    # SAVE VISUAL FRAME
    # ------------------------------------------------

    def add_frame(
        self,
        title,
        detail,
        roles=None,
        arrow=None
    ):

        self.frames.append({

            "title": title,

            "detail": detail,

            "roles": roles or {},

            "arrow": arrow,

            "tree": self.snapshot()
        })


    # ------------------------------------------------
    # LEFT ROTATION
    # ------------------------------------------------

    def left_rotate(self, x):

        y = x.right

        x.right = y.left

        if y.left is not self.NIL:
            y.left.parent = x

        y.parent = x.parent

        if x.parent is self.NIL:

            self.root = y

        elif x is x.parent.left:

            x.parent.left = y

        else:

            x.parent.right = y

        y.left = x

        x.parent = y

        self.add_frame(

            "LEFT ROTATION",

            f"LEFT-ROTATE({x.key})",

            {
                "current": x.key,
                "parent": y.key
            },

            "left"
        )


    # ------------------------------------------------
    # RIGHT ROTATION
    # ------------------------------------------------

    def right_rotate(self, x):

        y = x.left

        x.left = y.right

        if y.right is not self.NIL:
            y.right.parent = x

        y.parent = x.parent

        if x.parent is self.NIL:

            self.root = y

        elif x is x.parent.right:

            x.parent.right = y

        else:

            x.parent.left = y

        y.right = x

        x.parent = y

        self.add_frame(

            "RIGHT ROTATION",

            f"RIGHT-ROTATE({x.key})",

            {
                "current": x.key,
                "parent": y.key
            },

            "right"
        )


    # ------------------------------------------------
    # INSERT
    # ------------------------------------------------

    def insert(self, key):

        self.frames = []

        z = Node(key, RED)

        z.left = self.NIL
        z.right = self.NIL

        y = self.NIL

        x = self.root

        while x is not self.NIL:

            y = x

            if key == x.key:

                self.add_frame(
                    "REJECTED",
                    f"{key} already exists.",
                    {"current": key}
                )

                return False

            if key < x.key:
                x = x.left

            else:
                x = x.right

        z.parent = y

        if y is self.NIL:

            self.root = z

        elif key < y.key:

            y.left = z

        else:

            y.right = z

        self.add_frame(

            "INSERT",

            f"Inserted {key} as RED.",

            {
                "current": key
            }
        )

        self.insert_fixup(z)

        self.root.color = BLACK

        self.add_frame(

            "COMPLETE",

            f"Root {self.root.key} is BLACK.",

            {
                "current": self.root.key
            }
        )

        return True


    # ------------------------------------------------
    # INSERT FIXUP
    # ------------------------------------------------

    def insert_fixup(self, z):

        while z.parent.color == RED:

            # ========================================
            # PARENT IS LEFT CHILD
            # ========================================

            if z.parent is z.parent.parent.left:

                uncle = z.parent.parent.right

                # CASE 1
                if uncle.color == RED:

                    self.add_frame(

                        "INSERT CASE 1",

                        "Parent and Uncle are RED → recolor.",

                        {
                            "current": z.key,
                            "parent": z.parent.key,
                            "uncle": uncle.key,
                            "grandparent": z.parent.parent.key
                        }
                    )

                    z.parent.color = BLACK
                    uncle.color = BLACK
                    z.parent.parent.color = RED

                    self.add_frame(

                        "RECOLOR",

                        "Parent → BLACK, Uncle → BLACK, Grandparent → RED.",

                        {
                            "parent": z.parent.key,
                            "uncle": uncle.key,
                            "grandparent": z.parent.parent.key
                        }
                    )

                    z = z.parent.parent

                else:

                    # CASE 2
                    if z is z.parent.right:

                        self.add_frame(

                            "INSERT CASE 2",

                            "Triangle → LEFT-ROTATE(parent).",

                            {
                                "current": z.key,
                                "parent": z.parent.key,
                                "uncle": uncle.key
                            }
                        )

                        z = z.parent

                        self.left_rotate(z)

                    # CASE 3

                    self.add_frame(

                        "INSERT CASE 3",

                        "Line → recolor + RIGHT-ROTATE(grandparent).",

                        {
                            "parent": z.parent.key,
                            "grandparent": z.parent.parent.key
                        }
                    )

                    z.parent.color = BLACK
                    z.parent.parent.color = RED

                    self.right_rotate(z.parent.parent)


            # ========================================
            # MIRROR CASES
            # ========================================

            else:

                uncle = z.parent.parent.left

                # MIRROR CASE 1

                if uncle.color == RED:

                    self.add_frame(

                        "INSERT MIRROR CASE 1",

                        "Parent and Uncle are RED → recolor.",

                        {
                            "current": z.key,
                            "parent": z.parent.key,
                            "uncle": uncle.key,
                            "grandparent": z.parent.parent.key
                        }
                    )

                    z.parent.color = BLACK
                    uncle.color = BLACK
                    z.parent.parent.color = RED

                    z = z.parent.parent

                else:

                    # MIRROR CASE 2

                    if z is z.parent.left:

                        self.add_frame(

                            "INSERT MIRROR CASE 2",

                            "Triangle → RIGHT-ROTATE(parent).",

                            {
                                "current": z.key,
                                "parent": z.parent.key
                            }
                        )

                        z = z.parent

                        self.right_rotate(z)

                    # MIRROR CASE 3

                    self.add_frame(

                        "INSERT MIRROR CASE 3",

                        "Line → recolor + LEFT-ROTATE(grandparent).",

                        {
                            "parent": z.parent.key,
                            "grandparent": z.parent.parent.key
                        }
                    )

                    z.parent.color = BLACK
                    z.parent.parent.color = RED

                    self.left_rotate(z.parent.parent)


    # ------------------------------------------------
    # SEARCH
    # ------------------------------------------------

    def search(self, key):

        x = self.root

        while x is not self.NIL:

            if x.key == key:
                return x

            if key < x.key:
                x = x.left

            else:
                x = x.right

        return self.NIL


    # ------------------------------------------------
    # TRANSPLANT
    # ------------------------------------------------

    def transplant(self, u, v):

        if u.parent is self.NIL:

            self.root = v

        elif u is u.parent.left:

            u.parent.left = v

        else:

            u.parent.right = v

        v.parent = u.parent


    # ------------------------------------------------
    # MINIMUM
    # ------------------------------------------------

    def minimum(self, x):

        while x.left is not self.NIL:

            x = x.left

        return x


    # ------------------------------------------------
    # DELETE
    # ------------------------------------------------

    def delete(self, key):

        self.frames = []

        z = self.search(key)

        if z is self.NIL:

            self.add_frame(

                "REJECTED",

                f"{key} not found.",

                {
                    "current": key
                }
            )

            return False

        y = z

        original_color = y.color

        # -----------------------------
        # No left child
        # -----------------------------

        if z.left is self.NIL:

            x = z.right

            self.transplant(z, z.right)

            self.add_frame(

                "DELETE",

                f"Removed {key}.",

                {
                    "current": key
                }
            )

        # -----------------------------
        # No right child
        # -----------------------------

        elif z.right is self.NIL:

            x = z.left

            self.transplant(z, z.left)

            self.add_frame(

                "DELETE",

                f"Removed {key}.",

                {
                    "current": key
                }
            )

        # -----------------------------
        # Two children
        # -----------------------------

        else:

            y = self.minimum(z.right)

            original_color = y.color

            x = y.right

            self.add_frame(

                "SUCCESSOR",

                f"Successor of {key} is {y.key}.",

                {
                    "current": key,
                    "successor": y.key
                }
            )

            if y.parent is z:

                x.parent = y

            else:

                self.transplant(y, y.right)

                y.right = z.right
                y.right.parent = y

            self.transplant(z, y)

            y.left = z.left
            y.left.parent = y

            y.color = z.color

            self.add_frame(

                "REPLACE",

                f"Replaced {key} with successor {y.key}.",

                {
                    "successor": y.key
                }
            )

        # -----------------------------
        # BLACK FIXUP
        # -----------------------------

        if original_color == BLACK:

            self.add_frame(

                "DELETE-FIXUP",

                "BLACK node removed → delete fix-up required.",

                {
                    "current": x.key if x is not self.NIL else None
                }
            )

            self.delete_fixup(x)

        else:

            self.add_frame(

                "COMPLETE",

                "Removed RED node → no fix-up required.",

                {
                    "current": key
                }
            )

        if self.root is not self.NIL:
            self.root.color = BLACK

        self.add_frame(

            "COMPLETE",

            "Deletion complete.",

            {
                "current":
                self.root.key
                if self.root is not self.NIL
                else None
            }
        )

        return True


    # ------------------------------------------------
    # DELETE FIXUP
    # ------------------------------------------------

    def delete_fixup(self, x):

        while x is not self.root and x.color == BLACK:

            # ========================================
            # x IS RIGHT CHILD
            # ========================================

            if x is x.parent.right:

                sibling = x.parent.left

                # CASE 1

                if sibling.color == RED:

                    self.add_frame(

                        "DELETE CASE 1",

                        "Sibling is RED → recolor + RIGHT-ROTATE(parent).",

                        {
                            "current":
                            x.key if x is not self.NIL else None,

                            "parent": x.parent.key,

                            "sibling": sibling.key
                        },

                        "right"
                    )

                    sibling.color = BLACK
                    x.parent.color = RED

                    self.right_rotate(x.parent)

                    sibling = x.parent.left

                # CASE 2

                if (
                    sibling.left.color == BLACK
                    and sibling.right.color == BLACK
                ):

                    self.add_frame(

                        "DELETE CASE 2",

                        "Sibling BLACK + both nephews BLACK → sibling RED; move x upward.",

                        {
                            "current":
                            x.key if x is not self.NIL else None,

                            "parent": x.parent.key,

                            "sibling": sibling.key
                        }
                    )

                    sibling.color = RED

                    x = x.parent

                else:

                    # CASE 3

                    if sibling.right.color == BLACK:

                        self.add_frame(

                            "DELETE CASE 3",

                            "Near nephew RED, Far nephew BLACK → recolor + LEFT-ROTATE(sibling).",

                            {
                                "current":
                                x.key if x is not self.NIL else None,

                                "parent": x.parent.key,

                                "sibling": sibling.key,

                                "near":
                                sibling.left.key
                                if sibling.left is not self.NIL
                                else None
                            },

                            "left"
                        )

                        sibling.left.color = BLACK
                        sibling.color = RED

                        self.left_rotate(sibling)

                        sibling = x.parent.left

                    # CASE 4

                    self.add_frame(

                        "DELETE CASE 4",

                        "Far nephew RED → recolor + RIGHT-ROTATE(parent).",

                        {
                            "current":
                            x.key if x is not self.NIL else None,

                            "parent": x.parent.key,

                            "sibling": sibling.key,

                            "far":
                            sibling.left.key
                            if sibling.left is not self.NIL
                            else None
                        },

                        "right"
                    )

                    sibling.color = x.parent.color
                    x.parent.color = BLACK
                    sibling.left.color = BLACK

                    self.right_rotate(x.parent)

                    x = self.root


            # ========================================
            # x IS LEFT CHILD
            # ========================================

            else:

                sibling = x.parent.right

                # MIRROR CASE 1

                if sibling.color == RED:

                    self.add_frame(

                        "DELETE MIRROR CASE 1",

                        "Sibling RED → recolor + LEFT-ROTATE(parent).",

                        {
                            "current":
                            x.key if x is not self.NIL else None,

                            "parent": x.parent.key,

                            "sibling": sibling.key
                        },

                        "left"
                    )

                    sibling.color = BLACK
                    x.parent.color = RED

                    self.left_rotate(x.parent)

                    sibling = x.parent.right

                # MIRROR CASE 2

                if (
                    sibling.right.color == BLACK
                    and sibling.left.color == BLACK
                ):

                    self.add_frame(

                        "DELETE MIRROR CASE 2",

                        "Sibling BLACK + both nephews BLACK → sibling RED.",

                        {
                            "current":
                            x.key if x is not self.NIL else None,

                            "parent": x.parent.key,

                            "sibling": sibling.key
                        }
                    )

                    sibling.color = RED

                    x = x.parent

                else:

                    # MIRROR CASE 3

                    if sibling.left.color == BLACK:

                        self.add_frame(

                            "DELETE MIRROR CASE 3",

                            "Near nephew RED → recolor + RIGHT-ROTATE(sibling).",

                            {
                                "current":
                                x.key if x is not self.NIL else None,

                                "parent": x.parent.key,

                                "sibling": sibling.key
                            },

                            "right"
                        )

                        sibling.right.color = BLACK
                        sibling.color = RED

                        self.right_rotate(sibling)

                        sibling = x.parent.right

                    # MIRROR CASE 4

                    self.add_frame(

                        "DELETE MIRROR CASE 4",

                        "Far nephew RED → recolor + LEFT-ROTATE(parent).",

                        {
                            "current":
                            x.key if x is not self.NIL else None,

                            "parent": x.parent.key,

                            "sibling": sibling.key
                        },

                        "left"
                    )

                    sibling.color = x.parent.color
                    x.parent.color = BLACK
                    sibling.right.color = BLACK

                    self.left_rotate(x.parent)

                    x = self.root

        x.color = BLACK

        self.add_frame(

            "FIX-UP COMPLETE",

            "x is BLACK; delete fix-up finished.",

            {
                "current":
                x.key if x is not self.NIL else None
            }
        )

# ------------------------------------------------
    # INORDER
    # ------------------------------------------------

    def inorder(self):

        result = []

        def visit(x):

            if x is self.NIL:
                return

            visit(x.left)

            result.append(x.key)

            visit(x.right)

        visit(self.root)

        return result


    # ------------------------------------------------
    # HEIGHT
    # ------------------------------------------------

    def height(self):

        def h(x):

            if x is self.NIL:
                return 0

            return 1 + max(
                h(x.left),
                h(x.right)
            )

        return h(self.root)


    # ------------------------------------------------
    # COUNTS
    # ------------------------------------------------

    def counts(self):

        red = 0
        black = 0

        def visit(x):

            nonlocal red, black

            if x is self.NIL:
                return

            if x.color == RED:
                red += 1

            else:
                black += 1

            visit(x.left)
            visit(x.right)

        visit(self.root)

        return red, black


    # ------------------------------------------------
    # VALIDATION
    # ------------------------------------------------

    def valid(self):

        if (
            self.root is not self.NIL
            and self.root.color != BLACK
        ):
            return False

        def check(x):

            if x is self.NIL:
                return 1

            if (
                x.color == RED
                and (
                    x.left.color == RED
                    or x.right.color == RED
                )
            ):
                raise ValueError

            left = check(x.left)
            right = check(x.right)

            if left != right:
                raise ValueError

            return left + (
                1 if x.color == BLACK else 0
            )

        try:

            check(self.root)

            return True

        except ValueError:

            return False


# ====================================================
# BUILD TREE
# ====================================================

def build_tree(values):

    tree = RBTree()

    for value in values:
        tree.insert(value)

    return tree


# ====================================================
# ROUTES
# ====================================================

@app.route("/")
def index():

    return render_template("index.html")


@app.route("/api/simulate", methods=["POST"])
def simulate():

    data = request.get_json() or {}

    operation = data.get(
        "operation",
        "insert"
    )

    keys = [
        int(x)
        for x in data.get("keys", [])
        if str(x).strip().lstrip("-").isdigit()
    ]
# --------------------------------------------
    # INSERTION
    # --------------------------------------------

    if operation == "insert":

        tree = RBTree()

        steps = []

        for key in keys:

            if tree.insert(key):

                steps.append({

                    "key": key,

                    "frames": tree.frames

                })

    # --------------------------------------------
    # DELETION
    # --------------------------------------------

    else:

        initial = [
            int(x)
            for x in data.get("initial", [])
            if str(x).strip().lstrip("-").isdigit()
        ]

        tree = build_tree(initial)

        steps = []

        for key in keys:

            if tree.delete(key):

                steps.append({

                    "key": key,

                    "frames": tree.frames

                })

    red, black = tree.counts()

    return jsonify({

        "steps": steps,

        "tree": tree.snapshot(),

        "inorder": tree.inorder(),

        "valid": tree.valid(),

        "height": tree.height(),

        "red_nodes": red,

        "black_nodes": black,

        "node_count": red + black

    })




if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )






                            
