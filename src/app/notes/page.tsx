"use client";

import { useState, useMemo } from "react";
import SearchBar from "@/components/SearchBar";

interface Note {
  id: string;
  title: string;
}

const notes: Note[] = [
  { id: "1", title: "Покупки" },
  { id: "2", title: "Идеи для проекта" },
  { id: "3", title: "Заметки с встречи" },
  { id: "4", title: "Рецепты" },
  { id: "5", title: "Планы на неделю" },
];

export default function NotesPage(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Заметки</h1>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      {filteredNotes.length === 0 ? (
        <p>Заметки не найдены</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredNotes.map((note) => (
            <li
              key={note.id}
              style={{
                padding: "0.75rem",
                borderBottom: "1px solid #eee",
              }}
            >
              {note.title}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
