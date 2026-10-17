import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import TcpSocket from "react-native-tcp-socket";

const PORT = 9800;

export default function App() {
  const [status, setStatus] = useState("starting");
  const [accepted, setAccepted] = useState(0);

  useEffect(() => {
    const server = TcpSocket.createServer((socket) => {
      setAccepted((n) => n + 1);
      socket.on("error", () => {});
      socket.on("data", () => socket.destroy());
    });
    server.on("error", (e) => setStatus(`error: ${e.message}`));
    server.listen({ port: PORT, host: "127.0.0.1" }, () =>
      setStatus(`listening on 127.0.0.1:${PORT}`),
    );
    return () => {
      server.close();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>react-native-tcp-socket accept crash</Text>
      <Text>{status}</Text>
      <Text>accepted connections: {accepted}</Text>
      <Text style={styles.hint}>Run `node probe.mjs` on the Mac.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontWeight: "600", fontSize: 16 },
  hint: { color: "#666", marginTop: 16 },
});
