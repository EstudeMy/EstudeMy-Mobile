#!/usr/bin/env python3
"""Point estudemy_app at a new password and store it in the server .env."""
import pathlib
import re
import secrets
import subprocess
import sys

ENV_PATH = pathlib.Path("/home/ubuntu/estudemy_deploy/.env")


def replace_key(text: str, key: str, value: str) -> str:
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.M)
    line = f"{key}={value}"
    if pattern.search(text):
        return pattern.sub(line, text, count=1)
    return text.rstrip() + "\n" + line + "\n"


def main() -> int:
    password = secrets.token_hex(24)
    js = (
        "const pw = process.env.APP_PW;"
        "const admin = db.getSiblingDB('admin');"
        "if (admin.getUser('estudemy_app')) {"
        " admin.updateUser('estudemy_app', {pwd: pw}); print('UPDATED');"
        "} else {"
        " admin.createUser({user:'estudemy_app', pwd: pw, roles:["
        "{role:'readWrite', db:'estudemy'},{role:'dbAdmin', db:'estudemy'}"
        "]}); print('CREATED'); }"
    )
    proc = subprocess.run(
        [
            "docker", "exec", "-i", "-e", f"APP_PW={password}",
            "estudemy_mongo",
            "bash", "-lc",
            'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" '
            "--authenticationDatabase admin --quiet",
        ],
        input=js + "\n",
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0 or ("UPDATED" not in proc.stdout and "CREATED" not in proc.stdout):
        sys.stderr.write("mongo_align_failed\n")
        return 1

    text = ENV_PATH.read_text(encoding="utf-8", errors="replace")
    uri = f"mongodb://estudemy_app:{password}@mongo:27017/estudemy?authSource=admin"
    text = replace_key(text, "MONGO_APP_PASSWORD", password)
    text = replace_key(text, "MONGO_URI", uri)
    text = replace_key(text, "FRONTEND_URL", "http://18.222.3.101:3000")
    text = replace_key(text, "BACKEND_URL", "http://18.222.3.101:5000")
    text = replace_key(text, "SCORE_SERVICE_URL", "http://18.222.3.101:5000/score")
    ENV_PATH.write_text(text, encoding="utf-8")
    print("ALIGNED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
