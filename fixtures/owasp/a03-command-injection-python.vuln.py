import os
import subprocess

from flask import request


def ping_host():
    host = request.args.get("host")
    return os.system(f"ping -c 1 {host}")


def run_backup():
    cmd = request.args.get("cmd")
    return subprocess.run(cmd, shell=True, capture_output=True)
