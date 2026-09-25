# Red-Black Tree DAA WebApp

Features:
- Insertion and deletion
- CLRS fix-up cases
- Step-by-step Previous / Next
- Play/Pause animation
- Recoloring and rotations in the inspector
- Tree colors, in-order traversal, validation
- Deletion mode separates the starting tree from deletion sequence

Run:
```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

Insertion demo: `41,38,31,12,19,8`

Deletion demo:
Starting tree: `41,38,31,12,19,8`
Delete sequence: `41,19,8`
