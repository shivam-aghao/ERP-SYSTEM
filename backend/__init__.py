# SSGMCE College ERP Backend Package
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ERP_ROOT = os.path.dirname(BASE_DIR)
if ERP_ROOT not in sys.path:
    sys.path.insert(0, ERP_ROOT)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
