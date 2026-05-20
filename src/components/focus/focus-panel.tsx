"use client";

import { useEffect, useMemo, useState } from "react";
import type { Spot } from "@/types/spot";
import { supabase } from "@/lib/supabase";

type FocusPanelProps = {
  spots: Spot[];
};

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

type StudySession = {
  id: number;
  spot_id: number;
  display_name: string;
  subject: string;
  note: string | null;
  seats_available: number;
  open_to_join: boolean;
  created_at: string;
};

const TWENTY_FIVE_MINUTES = 25 * 60;
const FIFTY_MINUTES = 50 * 60;

export function FocusPanel({ spots }: FocusPanelProps) {
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(
    spots[0]?.id ?? null
  );

  const [duration, setDuration] = useState(TWENTY_FIVE_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(TWENTY_FIVE_MINUTES);
  const [isRunning, setIsRunning] = useState(false);

  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Review lecture notes", completed: false },
    { id: 2, text: "Finish problem set", completed: false },
    { id: 3, text: "Read assigned chapter", completed: true },
  ]);

  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const selectedSpot = useMemo(() => {
    return spots.find((spot) => spot.id === selectedSpotId) || null;
  }, [spots, selectedSpotId]);

  useEffect(() => {
    async function fetchStudySessions() {
      if (!selectedSpotId) return;

      setLoadingSessions(true);

      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("spot_id", selectedSpotId)
        .is("ended_at", null)
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching study sessions:", error);
        setLoadingSessions(false);
        return;
      }

      setStudySessions(data || []);
      setLoadingSessions(false);
    }

    fetchStudySessions();
  }, [selectedSpotId]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  function changeDuration(newDuration: number) {
    setDuration(newDuration);
    setSecondsLeft(newDuration);
    setIsRunning(false);
  }

  function resetTimer() {
    setSecondsLeft(duration);
    setIsRunning(false);
  }

  function addTask() {
    if (!taskText.trim()) return;

    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: taskText.trim(),
        completed: false,
      },
    ]);

    setTaskText("");
  }

  function toggleTask(taskId: number) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-zinc-700">
          Studying at
        </label>

        <select
          value={selectedSpotId ?? ""}
          onChange={(e) => setSelectedSpotId(Number(e.target.value))}
          className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none transition focus:border-emerald-600"
        >
          {spots.map((spot) => (
            <option key={spot.id} value={spot.id}>
              {spot.name}
            </option>
          ))}
        </select>

        {selectedSpot && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-900">
              {selectedSpot.location}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSpot.has_outlets && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Outlets
                </span>
              )}
              {selectedSpot.has_whiteboards && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Whiteboards
                </span>
              )}
              {selectedSpot.has_food_nearby && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Food Nearby
                </span>
              )}
              {selectedSpot.has_natural_light && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Natural Light
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Timer</h2>

          <div className="mt-8 text-center">
            <p className="text-6xl font-semibold tracking-tight text-zinc-900">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => changeDuration(TWENTY_FIVE_MINUTES)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  duration === TWENTY_FIVE_MINUTES
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                25 min
              </button>

              <button
                type="button"
                onClick={() => changeDuration(FIFTY_MINUTES)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  duration === FIFTY_MINUTES
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                50 min
              </button>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                {isRunning ? "Pause" : "Start"}
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Tasks</h2>

          <div className="mt-5 flex gap-2">
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              placeholder="Add a task..."
              className="h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none transition focus:border-emerald-600"
            />

            <button
              type="button"
              onClick={addTask}
              className="h-11 rounded-xl bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Add
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-3 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="h-4 w-4 accent-emerald-700"
                />
                <span
                  className={
                    task.completed ? "text-zinc-400 line-through" : ""
                  }
                >
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Peers studying here
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              See who has checked in at your selected study spot.
            </p>
          </div>

          {selectedSpot && (
            <p className="text-sm font-medium text-zinc-600">
              {selectedSpot.name}
            </p>
          )}
        </div>

        <div className="mt-5">
          {loadingSessions ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              Loading active sessions...
            </div>
          ) : studySessions.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              No active sessions at this spot yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {studySessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        {session.display_name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {session.subject}
                      </p>
                    </div>

                    {session.open_to_join && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        Open to join
                      </span>
                    )}
                  </div>

                  {session.note && (
                    <p className="mt-3 text-sm leading-6 text-zinc-700">
                      {session.note}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-zinc-500">
                    {session.seats_available} seat
                    {session.seats_available === 1 ? "" : "s"} available
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}