import os
import shlex
import subprocess

from flask import request


def ping_host():
    host = request.args.get("host")
    safe_host = shlex.quote(host)
    return os.system(f"ping -c 1 {safe_host}")


def run_backup():
    cmd = request.args.get("cmd")
    return subprocess.run(["backup", cmd], shell=False, capture_output=True)
