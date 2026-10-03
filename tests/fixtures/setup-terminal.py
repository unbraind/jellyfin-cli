"""Exercise setup through a real terminal using synthetic credentials only."""
import http.server
import json
import os
import pty
import select
import subprocess
import sys
import tempfile
import termios
import threading
import time

SECRET = "synthetic-terminal-credential"
PASSWORD = " synthetic pässword 🔑 "


class MockServer(http.server.BaseHTTPRequestHandler):
    """Serve only the setup endpoints on loopback."""

    def log_message(self, *_args):
        """Keep request details out of test output."""

    def respond(self, value, status=200):
        """Write a JSON response."""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(value).encode())

    def do_GET(self):
        """Validate the synthetic key before returning users."""
        if self.path == "/System/Info/Public":
            self.respond({"ServerName": "Mock", "Version": "10.11.11", "Id": "mock"})
        elif self.path == "/Users":
            header = str(dict(self.headers))
            if SECRET not in header and "mock-access-token" not in header:
                self.respond({}, 401)
            else:
                self.respond([{"Id": "test-user", "Name": "test"}])
        else:
            self.respond({}, 404)

    def do_POST(self):
        """Validate that password editing preserved the intended value."""
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
        if self.path == "/Users/AuthenticateByName" and body.get("Pw") == PASSWORD:
            self.respond({"User": {"Id": "test-user", "Name": "test"}, "AccessToken": "mock-access-token"})
        else:
            self.respond({}, 401)


def run_case(runtime, mode, redirected=False, alias=False):
    """Check secrecy, successful values, and terminal restoration on each exit."""
    master, slave = pty.openpty()
    initial = termios.tcgetattr(slave)
    terminal_output = bytearray()
    with tempfile.TemporaryDirectory(prefix="jf-terminal-") as home:
        env = {key: value for key, value in os.environ.items()
               if not key.startswith(("JELLYFIN_", "JF_", "GH_", "GITHUB_"))}
        # Setup's post-action star hook must not use the host's gh credentials
        # or open another prompt in this credential-entry regression fixture.
        # A PATH-local stub also prevents access to gh's saved login state.
        bin_dir = os.path.join(home, "bin")
        os.mkdir(bin_dir)
        gh = os.path.join(bin_dir, "gh")
        with open(gh, "w", encoding="utf-8") as stub:
            stub.write("#!/bin/sh\nexit 1\n")
        os.chmod(gh, 0o755)
        env["PATH"] = bin_dir + os.pathsep + env.get("PATH", os.defpath)
        env.update(HOME=home, JELLYFIN_CONFIG_DIR=home, NO_PROXY="127.0.0.1,localhost")
        with tempfile.TemporaryFile() as stdout:
            args = runtime + ["setup"] + (["wizard"] if alias else []) + [
                "--server", f"http://127.0.0.1:{server.server_port}",
                "--format", "json"]
            if not alias:
                args += ["--output-format", "json", "--timeout", "1000"]
            proc = subprocess.Popen(args, stdin=slave, stdout=stdout if redirected else slave,
                                    stderr=slave, env=env)

            def capture():
                """Read available terminal output and redirected stdout without blocking."""
                if select.select([master], [], [], 0.05)[0]:
                    terminal_output.extend(os.read(master, 65536))
                return bytes(terminal_output) + os.pread(stdout.fileno(), 1000000, 0)

            def wait_for(marker):
                """Fail quickly if the CLI never reaches the expected prompt."""
                deadline = time.monotonic() + 15
                while time.monotonic() < deadline:
                    if marker in capture():
                        return
                    if proc.poll() is not None:
                        break
                raise AssertionError(f"Missing prompt {marker!r} in {mode}: {capture()!r}")

            try:
                if alias:
                    wait_for(b"Default output format")
                    os.write(master, b"json\n")
                    wait_for(b"Request timeout")
                    os.write(master, b"1000\n")
                wait_for(b"Authentication method")
                password = mode == "password"
                os.write(master, b"1\n" if password else b"2\n")
                if password:
                    wait_for(b"Enter Username:")
                    os.write(master, b"test\n")
                wait_for(b"Enter Password:" if password else b"Enter API Key:")
                # Backspace must edit the value without exposing either representation.
                secret = PASSWORD if password else SECRET
                if mode != "empty":
                    os.write(master, secret.encode() + b"X\x7f")
                if mode == "interrupt":
                    os.write(master, b"\x03")
                elif mode == "eof":
                    os.write(master, b"\x15\x04")
                else:
                    os.write(master, b"\n")
                deadline = time.monotonic() + 15
                while proc.poll() is None and time.monotonic() < deadline:
                    capture()
                try:
                    code = proc.wait(timeout=1)
                except subprocess.TimeoutExpired as error:
                    raise AssertionError(f"CLI did not exit in {mode}: {capture()!r}") from error
                output = capture()
                assert secret.encode() not in output, f"Credential echoed in {mode}"
                final = termios.tcgetattr(slave)
                mask = termios.ECHO | termios.ICANON | termios.ISIG
                assert final[3] & mask == initial[3] & mask, f"Terminal not restored in {mode}"
                path = os.path.join(home, "settings.json")
                if mode in ("interrupt", "eof", "empty"):
                    assert code != 0 and not os.path.exists(path), f"Cancellation saved credentials in {mode}"
                    if mode != "empty":
                        assert code == 130, f"Wrong cancellation exit status in {mode}"
                        assert b'"error": "Setup cancelled."' in output
                        assert b"AbortError" not in output and b"Unhandled rejection" not in output
                else:
                    assert code == 0, f"Setup failed in {mode}: {code}"
                    with open(path, encoding="utf-8") as saved:
                        config = json.load(saved)["defaultServer"]
                    assert config["password" if password else "apiKey"] == secret
            finally:
                if proc.poll() is None:
                    proc.kill()
                    proc.wait()
    os.close(master)
    os.close(slave)


server = http.server.HTTPServer(("127.0.0.1", 0), MockServer)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    for case in ("key", "password", "interrupt", "eof", "empty"):
        run_case(sys.argv[1:], case, alias=case == "password")
    run_case(sys.argv[1:], "key", redirected=True)
    print("6 terminal cases passed: key, password, interrupt, EOF, empty input, redirected stdout")
finally:
    server.shutdown()
    server.server_close()
