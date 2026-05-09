import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'c_core'))

try:
    from c_wrapper import PropertyDS
    print("Successfully imported PropertyDS")
except Exception as e:
    print(f"Failed to import PropertyDS: {e}")
    import traceback
    traceback.print_exc()