#!/usr/bin/env python3
"""
NeuraCare Model Test Environment
Tests neuracare-doctor and neuracare-patient ollama models created from
Modelfile.doctor and Modelfile.patient respectively.
Interactive chat: run this file to talk to Doctor or Patient models.
Commands: /doctor | /patient | /clear | /quit
"""

from typing import Dict, List, Tuple

import ollama

# ---------------------------------------------------------------------------
# Model names (created via: ollama create <name> -f <Modelfile>)
# ---------------------------------------------------------------------------
CURRENT_MODEL = 'gemma3:27b-cloud'
DOCTOR_MODEL = 'gemma3-doctor:latest'
PATIENT_MODEL = 'gemma3-patient:latest'
