# react-native-tcp-socket: iOS crash when an accepted connection resets early

Minimal reproduction for a native crash in `react-native-tcp-socket` 6.4.3 on iOS.

A `TcpSocket.createServer` server crashes the app with `SIGABRT` when a client connects and resets
the connection before the accept callback runs on the main queue:

```
*** Terminating app due to uncaught exception 'NSInvalidArgumentException',
reason: '*** -[__NSPlaceholderDictionary initWithObjects:forKeys:count:]:
attempt to insert nil object from objects[2]'
...
3  CoreFoundation  +[NSDictionary dictionaryWithObjects:forKeys:count:] + 48
4  ...debug.dylib  -[TcpSockets onSocketConnection:toClient:connectionType:] + 600
5  ...debug.dylib  -[TcpSockets onConnection:toClient:] + 104
6  ...debug.dylib  -[TcpSocketClient socket:didAcceptNewSocket:] + 336
```

`objects[2]` is `remoteAddress`: `[socket connectedHost]` returns nil because `getpeername()` fails
once the peer has reset the connection. 6.4.3 already guards this race in `onConnect` (#235), but
`onSocketConnection` (server side, `connection` / `secureConnection` events) and `onListen` still put
the getter results straight into an `NSDictionary` literal.

In practice this happens with port scanners, health checks or any client that gives up quickly
(connect with a short timeout, then abort).

## Reproduce

Requirements: macOS with Xcode, an iOS simulator, Node 18+.

```bash
npm install
npx expo run:ios
```

The app starts a server on `127.0.0.1:9800` (the iOS simulator shares the Mac's loopback). When it
shows "listening", run on the Mac:

```bash
node probe.mjs
```

`probe.mjs` opens 2000 connections (50 at a time) and resets each one (`socket.resetAndDestroy()`)
as soon as it is established. The app crashes within the first few hundred connections; after that
the probe reports `refused` because the server is gone. The exception is printed in the
`expo run:ios` output.

Tested with Expo SDK 58, React Native 0.88, react-native-tcp-socket 6.4.3, iOS 27 simulator.

## Fix

[`fix.patch`](fix.patch) (patch-package format) falls back to `@"unknown"` for nil addresses, the
same fallback `TcpSocketClient getAddress` already uses. With it applied, 5000 probe connections go
through and the app stays up:

```bash
git apply fix.patch   # patches node_modules/react-native-tcp-socket
npx expo run:ios
node probe.mjs
```
