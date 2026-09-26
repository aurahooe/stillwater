"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { browserClient } from "../../lib/supabase";

export default function Desk() {
  const sb = browserClient();
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [mine, setMine] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function loadMine(userId) {
    const { data } = await sb.from("still_notes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setMine(data || []);
  }

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadMine(data.session.user.id);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadMine(s.user.id);
      else setMine([]);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp(e) {
    e.preventDefault(); setErr(""); setMsg("");
    const { error } = await sb.auth.signUp({ email, password });
    if (error) setErr(error.message);
    else setMsg("Desk ready. If email confirmation is on, check your inbox.");
  }
  async function signIn(e) {
    e.preventDefault(); setErr("");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
  }
  async function signOut() { await sb.auth.signOut(); }
  async function publish(e) {
    e.preventDefault(); setErr("");
    if (!body.trim()) return;
    const { error } = await sb.from("still_notes").insert({ user_id: session.user.id, body: body.trim(), is_public: isPublic });
    if (error) setErr(error.message);
    else { setBody(""); loadMine(session.user.id); }
  }
  async function remove(id) { await sb.from("still_notes").delete().eq("id", id); loadMine(session.user.id); }
  async function flip(note) { await sb.from("still_notes").update({ is_public: !note.is_public }).eq("id", note.id); loadMine(session.user.id); }

  return (
    <main className="wrap">
      <header className="top">
        <Link href="/" className="mark">Still<em>water</em></Link>
        <nav className="nav"><Link href="/">The table</Link></nav>
      </header>
      {!session && (
        <section className="panel">
          <h2>Sit down</h2>
          <p style={{ color: "var(--mute)", marginBottom: 16, maxWidth: "46ch" }}>Email and password. Public notes appear on the table. Private notes stay here.</p>
          <form>
            <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="password (8+)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="row">
              <button className="btn" onClick={signIn}>Sign in</button>
              <button className="btn ghost" onClick={signUp}>Create desk</button>
            </div>
            {err && <p className="err">{err}</p>}
            {msg && <p className="ok">{msg}</p>}
          </form>
        </section>
      )}
      {session && (
        <>
          <section className="panel">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2>Leave a note</h2>
              <button className="btn ghost" onClick={signOut}>Leave desk</button>
            </div>
            <form onSubmit={publish}>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Something small enough to put on paper." maxLength={4000} />
              <label className="toggle">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Show this on the public table
              </label>
              <button className="btn" type="submit">Save</button>
              {err && <p className="err">{err}</p>}
            </form>
          </section>
          <section className="panel">
            <h2>Your paper</h2>
            <div className="grid">
              {mine.length === 0 && <p style={{ color: "var(--mute)" }}>Nothing saved yet.</p>}
              {mine.map((note) => (
                <article className="card" key={note.id}>
                  <div className="meta">{note.is_public ? "public" : "private"} · {new Date(note.created_at).toLocaleString()}</div>
                  <p>{note.body}</p>
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn ghost" onClick={() => flip(note)}>{note.is_public ? "Make private" : "Make public"}</button>
                    <button className="btn ghost" onClick={() => remove(note.id)}>Tear up</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
