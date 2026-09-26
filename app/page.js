"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { browserClient } from "../lib/supabase";

export default function Home() {
  const [hour, setHour] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = browserClient();
    Promise.all([
      sb.from("still_hours").select("*").order("created_at", { ascending: false }).limit(1),
      sb.from("still_notes").select("id, body, created_at, still_profiles(handle, display_name)").eq("is_public", true).order("created_at", { ascending: false }).limit(40),
    ]).then(([h, n]) => {
      setHour(h.data?.[0] || null);
      setNotes(n.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="wrap">
      <header className="top">
        <div className="mark">Still<em>water</em></div>
        <nav className="nav">
          <Link href="/desk">Your desk</Link>
        </nav>
      </header>
      <section className="hour">
        <small><span className="lamp" /> This hour</small>
        <h1>{hour?.title || "The lamp is warming."}</h1>
        <p>{hour?.body || "A new feature arrives every hour. Public notes from readers collect below."}</p>
      </section>
      <section className="grid">
        {loading && <p className="meta">Gathering paper...</p>}
        {!loading && notes.length === 0 && (
          <article className="card">
            <div className="meta">empty table</div>
            <p>Nothing public yet. Sign in at your desk and leave a note marked public.</p>
          </article>
        )}
        {notes.map((note, i) => (
          <article className="card" key={note.id} style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
            <div className="meta">
              {note.still_profiles?.display_name || note.still_profiles?.handle || "a reader"} · {new Date(note.created_at).toLocaleString()}
            </div>
            <p>{note.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
