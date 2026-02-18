"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import {
  createDocument,
  createWorkspace,
  ensureProfile,
  listDocuments,
  listWorkspaces,
  type DocumentRow,
  type Workspace,
} from "../../lib/db";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentRow[]>([]);

  const selectedWs = useMemo(
    () => workspaces.find((w) => w.id === selectedWsId) ?? null,
    [workspaces, selectedWsId]
  );

  const [newWsName, setNewWsName] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      setEmail(session.user.email ?? "");
      await ensureProfile();

      const ws = await listWorkspaces();
      setWorkspaces(ws);
      if (ws.length > 0) setSelectedWsId(ws[0].id);

      setLoading(false);
    })().catch((e) => {
      setMsg(e?.message ?? "Failed to load dashboard");
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    (async () => {
      if (!selectedWsId) {
        setDocs([]);
        return;
      }
      const d = await listDocuments(selectedWsId);
      setDocs(d);
    })().catch((e) => setMsg(e?.message ?? "Failed to load documents"));
  }, [selectedWsId]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function onCreateWorkspace() {
    setMsg(null);
    const name = newWsName.trim();
    if (!name) return;

    try {
      const ws = await createWorkspace(name);
      setWorkspaces((prev) => [ws, ...prev]);
      setSelectedWsId(ws.id);
      setNewWsName("");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to create workspace");
    }
  }

  async function onCreateDoc() {
    setMsg(null);
    if (!selectedWsId) {
      setMsg("Select a workspace first.");
      return;
    }

    const title = newDocTitle.trim() || "Untitled Document";

    try {
      const doc = await createDocument(selectedWsId, title);
      setDocs((prev) => [doc, ...prev]);
      setNewDocTitle("");
      router.push(`/doc/${doc.id}`);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to create document");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Logged in as <span className="font-medium">{email}</span>
            </p>
          </div>
          <button onClick={logout} className="rounded-xl border px-3 py-2 text-sm">
            Sign out
          </button>
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {msg}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Workspaces */}
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Workspaces</h2>

            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring"
                placeholder="New workspace name"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
              />
              <button
                onClick={onCreateWorkspace}
                className="rounded-xl bg-black px-3 py-2 text-sm text-white"
              >
                Create
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {workspaces.length === 0 ? (
                <p className="text-sm text-gray-600">No workspaces yet.</p>
              ) : (
                workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWsId(w.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      selectedWsId === w.id ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="font-medium">{w.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(w.created_at).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Documents */}
          <section className="md:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Documents {selectedWs ? `— ${selectedWs.name}` : ""}
              </h2>

              <div className="flex gap-2">
                <input
                  className="w-64 rounded-xl border px-3 py-2 text-sm outline-none focus:ring"
                  placeholder="New doc title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                />
                <button
                  onClick={onCreateDoc}
                  className="rounded-xl bg-black px-3 py-2 text-sm text-white"
                >
                  Create doc
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {docs.length === 0 ? (
                <p className="text-sm text-gray-600">No documents yet.</p>
              ) : (
                docs.map((d) => (
                  <Link
                    key={d.id}
                    className="block rounded-xl border px-3 py-2 hover:bg-gray-50"
                    href={`/doc/${d.id}`}
                  >
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(d.created_at).toLocaleString()}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
