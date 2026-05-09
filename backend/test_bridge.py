import traceback
from bridge import EngineBridge
import os

try:
    path = os.path.join(os.path.dirname(__file__), "data", "properties.csv")
    engine = EngineBridge(path)
    print("Bridge loaded!")
    print("Fallback active?", engine.fallback is not None)
except Exception as e:
    print("EXCEPTION:", e)
    traceback.print_exc()
