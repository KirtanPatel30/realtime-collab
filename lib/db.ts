import { supabase } from "./supabaseClient";

export type Workspace = {
  id: string;
  name: string;
  owner: string;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  title: string;
  workspace_id: string;
  created_by: string;
  created_at: string;
};

export async function ensureProfile() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;

  // Try to insert (if already exists, ignore)
  await supabase.from("profiles").upsert(
    { id: user.id, email: user.email },
    { onConflict: "id" }
  );
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Workspace[];
}

export async function createWorkspace(name: string) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("workspaces")
    .insert({ name, owner: user.id })
    .select("*")
    .single();

  if (error) throw error;
  return data as Workspace;
}

export async function listDocuments(workspaceId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function createDocument(workspaceId: string, title: string) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("documents")
    .insert({ workspace_id: workspaceId, title, created_by: user.id })
    .select("*")
    .single();

  if (error) throw error;
  return data as DocumentRow;
}
