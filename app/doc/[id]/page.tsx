"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import * as Y from "yjs";
import { supabase } from "../../../lib/supabaseClient";

import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";

// Uint8Array <-> base64 (safe for binary)
function uint8ToBase64(u8: Uint8Array) {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}
function base64ToUint8(b64: string) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

const ORIGIN_REMOTE = "remote";
const ORIGIN_SYNC = "sync";
const ORIGIN_DB = "db";

export default function DocPage() {
  const params = useParams();
  const docId = String(params?.id ?? "");

  const [status, setStatus] = useState("Connecting...");
  const [editor, setEditor] = useState<Editor | null>(null);

  // Presence UI
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // ✅ AI Summary state
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");

  // ✅ Selection + Explain state
  const [selectedText, setSelectedText] = useState("");
  const [aiExplain, setAiExplain] = useState("");
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiExplainError, setAiExplainError] = useState("");

  const editorRef = useRef<Editor | null>(null);
  const clientIdRef = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random())
  );

  const ydoc = useMemo(() => new Y.Doc(), []);

  // --- Persistence state ---
  const saveTimerRef = useRef<any>(null);
  const dirtyRef = useRef(false);
  const lastSavedRef = useRef<string>(""); // last saved base64 snapshot

  async function loadSnapshotFromDB() {
    const { data, error } = await supabase
      .from("doc_content")
      .select("content")
      .eq("id", docId)
      .maybeSingle();

    if (error) {
      console.warn("Load snapshot error:", error.message);
      return;
    }

    const b64 = data?.content;
    if (!b64) return;

    try {
      const snap = base64ToUint8(b64);
      Y.applyUpdate(ydoc, snap, ORIGIN_DB);
      lastSavedRef.current = b64;
    } catch (e) {
      console.warn("Snapshot decode/apply failed:", e);
    }
  }

  async function saveSnapshotToDB() {
    const snap = Y.encodeStateAsUpdate(ydoc);
    const b64 = uint8ToBase64(snap);

    // avoid saving identical snapshots
    if (b64 === lastSavedRef.current) {
      dirtyRef.current = false;
      return;
    }

    const { error } = await supabase.from("doc_content").upsert(
      {
        id: docId,
        content: b64,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Save snapshot error:", error.message);
      return;
    }

    lastSavedRef.current = b64;
    dirtyRef.current = false;
  }

  // ✅ AI Summary handler
  async function handleAiSummary() {
    setAiError("");
    setAiSummary("");

    if (!editor) {
      setAiError("Editor not ready yet.");
      return;
    }

    const text = editor.getText()?.trim();
    if (!text) {
      setAiError("Document is empty — add some text first.");
      return;
    }

    try {
      setAiLoading(true);

      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data?.error || "AI request failed.");
        return;
      }

      setAiSummary(data?.summary || "");
    } catch (e: any) {
      setAiError(e?.message || "AI error");
    } finally {
      setAiLoading(false);
    }
  }

  // ✅ Explain Selection handler
  async function handleExplainSelection() {
    setAiExplainError("");
    setAiExplain("");

    const text = selectedText.trim();
    if (!text) {
      setAiExplainError("Select some text first.");
      return;
    }

    try {
      setAiExplainLoading(true);

      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiExplainError(data?.error || "AI request failed.");
        return;
      }

      setAiExplain(data?.explanation || "");
    } catch (e: any) {
      setAiExplainError(e?.message || "AI error");
    } finally {
      setAiExplainLoading(false);
    }
  }

  // ✅ Capture selected text
  useEffect(() => {
    const onMouseUp = () => {
      const t = window.getSelection()?.toString() ?? "";
      setSelectedText(t.trim());
    };

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  // Create editor
  useEffect(() => {
    const ed = new Editor({
      extensions: [
        StarterKit.configure({ history: false }),
        Collaboration.configure({ document: ydoc }),
      ],
      editorProps: {
        attributes: {
          class: "min-h-[240px] outline-none prose max-w-none p-2",
        },
      },
    });

    editorRef.current = ed;
    setEditor(ed);

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      setEditor(null);
    };
  }, [ydoc]);

  // Load snapshot ONCE when doc opens
  useEffect(() => {
    if (!docId) return;
    loadSnapshotFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  // Realtime channel + robust Yjs sync + Presence
  useEffect(() => {
    if (!docId) return;

    let channel: any;
    let resyncTimer: any = null;

    const myClientId = clientIdRef.current;

    const sendStateVectorRequest = () => {
      if (!channel) return;
      const sv = Y.encodeStateVector(ydoc);
      channel.send({
        type: "broadcast",
        event: "sv_req",
        payload: { clientId: myClientId, sv_b64: uint8ToBase64(sv) },
      });
    };

    const updatePresenceUI = () => {
      if (!channel) return;

      const state = channel.presenceState?.() ?? {};
      const keys = Object.keys(state);

      setOnlineCount(keys.length > 0 ? keys.length : 1);

      const names: string[] = [];
      for (const k of keys) {
        const arr = state[k];
        if (Array.isArray(arr) && arr[0]) {
          const n = arr[0].name || arr[0].email || "Anonymous";
          names.push(String(n));
        } else {
          names.push("Anonymous");
        }
      }
      names.sort((a, b) => a.localeCompare(b));
      setOnlineUsers(names);
    };

    (async () => {
      channel = supabase.channel(`doc:${docId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: myClientId },
        },
      });

      // Presence callbacks
      channel.on("presence", { event: "sync" }, () => updatePresenceUI());
      channel.on("presence", { event: "join" }, () => updatePresenceUI());
      channel.on("presence", { event: "leave" }, () => updatePresenceUI());

      // Receive incremental updates
      channel.on("broadcast", { event: "y_update" }, ({ payload }: any) => {
        if (!payload?.b64) return;
        const update = base64ToUint8(payload.b64);
        Y.applyUpdate(ydoc, update, ORIGIN_REMOTE);
      });

      // Respond with diff from state vector
      channel.on("broadcast", { event: "sv_req" }, ({ payload }: any) => {
        const requester = payload?.clientId;
        const sv_b64 = payload?.sv_b64;
        if (!requester || requester === myClientId || !sv_b64) return;

        const sv = base64ToUint8(sv_b64);
        const diff = Y.encodeStateAsUpdate(ydoc, sv);

        channel.send({
          type: "broadcast",
          event: "sv_res",
          payload: { clientId: requester, diff_b64: uint8ToBase64(diff) },
        });
      });

      // Apply diff response intended for me
      channel.on("broadcast", { event: "sv_res" }, ({ payload }: any) => {
        if (payload?.clientId !== myClientId) return;
        if (!payload?.diff_b64) return;

        const diff = base64ToUint8(payload.diff_b64);
        Y.applyUpdate(ydoc, diff, ORIGIN_SYNC);
      });

      await channel.subscribe(async (s: string) => {
        if (s === "SUBSCRIBED") {
          setStatus("Live ✅");

          const { data } = await supabase.auth.getUser();
          const email = data?.user?.email ?? "Anonymous";

          await channel.track({
            name: email,
            online_at: new Date().toISOString(),
          });

          updatePresenceUI();

          sendStateVectorRequest();
          resyncTimer = setInterval(sendStateVectorRequest, 2000);
        } else {
          setStatus(s);
        }
      });

      // Send local updates only (skip remote/sync/db origins)
      let debounce: any = null;
      const onUpdate = (update: Uint8Array, origin: any) => {
        dirtyRef.current = true;

        // Autosave: wait ~2s after last change
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          if (dirtyRef.current) saveSnapshotToDB();
        }, 2000);

        if (!channel) return;
        if (
          origin === ORIGIN_REMOTE ||
          origin === ORIGIN_SYNC ||
          origin === ORIGIN_DB
        )
          return;

        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => {
          channel.send({
            type: "broadcast",
            event: "y_update",
            payload: { b64: uint8ToBase64(update) },
          });
        }, 30);
      };

      ydoc.on("update", onUpdate);

      return () => {
        ydoc.off("update", onUpdate);
      };
    })();

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (resyncTimer) clearInterval(resyncTimer);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const hasSelection = selectedText.trim().length > 0;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Realtime Document</h1>
            <p className="text-sm text-gray-600">
              Status: <span className="font-medium">{status}</span>
              <span className="ml-3 text-gray-500">
                • Online: <span className="font-medium">{onlineCount}</span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAiSummary}
              disabled={!editor || aiLoading}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {aiLoading ? "AI..." : "✨ AI Summary"}
            </button>

            <button
              onClick={handleExplainSelection}
              disabled={aiExplainLoading || !hasSelection}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              title={
                hasSelection
                  ? `Selected: ${selectedText.slice(0, 40)}...`
                  : "Select text first"
              }
            >
              {aiExplainLoading ? "Explaining..." : "🧠 Explain"}
            </button>

            <Link href="/app" className="rounded-xl border px-3 py-2 text-sm">
              Back
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          {!editor ? (
            <p className="text-sm text-gray-600">Loading editor…</p>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        {/* ✅ AI Summary Panel */}
        {(aiError || aiSummary) && (
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">AI Summary</div>
              <button
                onClick={() => {
                  setAiError("");
                  setAiSummary("");
                }}
                className="text-xs text-gray-500 hover:underline"
              >
                Clear
              </button>
            </div>

            {aiError ? (
              <p className="mt-2 text-sm text-red-600">{aiError}</p>
            ) : (
              <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {aiSummary}
              </pre>
            )}
          </div>
        )}

        {/* ✅ Explain Selection Panel */}
        {(aiExplainError || aiExplain) && (
          <div className="mt-4 rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Explain Selection</div>
              <button
                onClick={() => {
                  setAiExplain("");
                  setAiExplainError("");
                }}
                className="text-xs text-gray-500 hover:underline"
              >
                Clear
              </button>
            </div>

            {aiExplainError ? (
              <p className="mt-2 text-sm text-red-600">{aiExplainError}</p>
            ) : (
              <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {aiExplain}
              </pre>
            )}

            {hasSelection && (
              <p className="mt-3 text-xs text-gray-500">
                Selected: {selectedText.slice(0, 120)}
                {selectedText.length > 120 ? "..." : ""}
              </p>
            )}
          </div>
        )}

        <div className="mt-3 rounded-xl border bg-white p-3 text-sm">
          <div className="font-medium">Online users</div>
          {onlineUsers.length === 0 ? (
            <p className="mt-2 text-gray-600">Loading…</p>
          ) : (
            <ul className="mt-2 list-disc pl-5 text-gray-700">
              {onlineUsers.map((u, i) => (
                <li key={`${u}-${i}`}>{u}</li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Autosaves to Supabase every ~2s after edits. Refresh should keep
          content.
        </p>
      </div>
    </main>
  );
}
