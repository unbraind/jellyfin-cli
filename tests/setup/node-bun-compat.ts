import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

type RouteValue = Response | ((request: Request) => Response | Promise<Response>);

interface ServeOptions {
  port: number;
  routes?: Record<string, RouteValue>;
  fetch?: (request: Request) => Response | Promise<Response>;
}

interface CompatServer {
  readonly port: number;
  stop(force?: boolean): void;
}

interface SpawnOptions {
  env?: Record<string, string | undefined>;
  stdin?: Blob;
  stdout?: 'pipe';
  stderr?: 'pipe';
}

interface CompatProcess {
  readonly stdout: ReadableStream<Uint8Array>;
  readonly stderr: ReadableStream<Uint8Array>;
  readonly exited: Promise<number>;
}

interface BunCompat {
  serve(options: ServeOptions): CompatServer;
  spawn(command: string[], options?: SpawnOptions): CompatProcess;
}

/** Converts a Node HTTP request into the standards-based request used by Bun routes. */
async function toRequest(request: IncomingMessage, port: number): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const method = request.method ?? 'GET';
  return new Request(`http://127.0.0.1:${port}${request.url ?? '/'}`, {
    method,
    headers: request.headers as HeadersInit,
    body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks),
  });
}

/** Writes a standards-based response through Node's HTTP response boundary. */
async function writeResponse(response: Response, target: ServerResponse): Promise<void> {
  target.statusCode = response.status;
  response.headers.forEach((value, name) => target.setHeader(name, value));
  target.end(Buffer.from(await response.arrayBuffer()));
}

if (typeof globalThis.Bun === 'undefined') {
  const compat: BunCompat = {
    serve(options) {
      let serverPort = options.port;
      const server = createServer(async (incoming, outgoing) => {
        try {
          const request = await toRequest(incoming, serverPort);
          const pathname = new URL(request.url).pathname;
          const route = options.routes?.[pathname];
          const response = route instanceof Response
            ? route.clone()
            : route
              ? await route(request)
              : options.fetch
                ? await options.fetch(request)
                : new Response('Not Found', { status: 404 });
          await writeResponse(response, outgoing);
        } catch (error) {
          outgoing.statusCode = 500;
          outgoing.end(error instanceof Error ? error.message : 'Test server failure');
        }
      });
      server.listen(serverPort);
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        throw new Error('Test server did not expose a TCP address');
      }
      serverPort = address.port;
      return {
        port: serverPort,
        stop() { server.close(); },
      };
    },
    spawn(command, options = {}) {
      const isTypeScriptCli = command[0] === 'bun'
        && command[1] === 'run'
        && command[2] === 'src/cli.ts';
      const executable = isTypeScriptCli ? process.execPath : (command[0] ?? '');
      const args = isTypeScriptCli
        ? ['--import', 'tsx', 'src/cli.ts', ...command.slice(3)]
        : command.slice(1);
      const child = spawn(executable, args, {
        env: options.env as NodeJS.ProcessEnv | undefined,
        stdio: [options.stdin ? 'pipe' : 'ignore', 'pipe', 'pipe'],
      });
      if (!child.stdout || !child.stderr) throw new Error('Failed to create child pipes');
      if (options.stdin && child.stdin) {
        child.stdin.on('error', () => {
          // The child may exit before draining stdin after an intentional validation failure.
        });
        void options.stdin.arrayBuffer().then((buffer) => {
          child.stdin?.end(Buffer.from(buffer));
        }, (error: unknown) => {
          child.stdin?.destroy(error instanceof Error ? error : new Error('Stdin read failed'));
        });
      }
      return {
        stdout: Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>,
        stderr: Readable.toWeb(child.stderr) as ReadableStream<Uint8Array>,
        exited: new Promise((resolve, reject) => {
          child.once('error', reject);
          child.once('close', (code) => resolve(code ?? 1));
        }),
      };
    },
  };
  Object.defineProperty(globalThis, 'Bun', { value: compat, configurable: true });
}
