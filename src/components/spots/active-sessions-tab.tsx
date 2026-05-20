"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type VibeReport = {
  id: number;
  spot_id: number;
  noise_level: string;
  crowd_level: string;
  outlets: string;
  created_at: string;
};

type StudySession = {
  id: number;
  spot_id: number;
  display_name: string;
  subject: string;
  note: string | null;
  seats_available: number;
  open_to_join: boolean;
  user_id: string | null;
  created_at: string;
};

type ActiveSessionsTabProps = {
  spotId: number;
};

export function ActiveSessionsTab({ spotId }: ActiveSessionsTabProps) {
  const [vibeReports, setVibeReports] = useState<VibeReport[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);

  const [noiseLevel, setNoiseLevel] = useState("Quiet");
  const [crowdLevel, setCrowdLevel] = useState("Moderate");
  const [outlets, setOutlets] = useState("Available");

  const [displayName, setDisplayName] = useState("");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [submittingVibe, setSubmittingVibe] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchActiveSessionData() {
      const { data: vibeRows, error: vibeError } = await supabase
        .from("vibe_reports")
        .select("*")
        .eq("spot_id", spotId)
        .order("id", { ascending: false });

      if (vibeError) {
        console.error("Error fetching vibe reports:", vibeError);
      }

      const { data: sessionRows, error: sessionError } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("spot_id", spotId)
        .is("ended_at", null)
        .order("id", { ascending: false });

      if (sessionError) {
        console.error("Error fetching study sessions:", sessionError);
      }

      setVibeReports(vibeRows || []);
      setStudySessions(sessionRows || []);
    }

    fetchActiveSessionData();
  }, [spotId]);

  const currentVibe = useMemo(() => {
    if (vibeReports.length === 0) {
      return {
        noise: "No reports yet",
        crowd: "No reports yet",
        outlets: "No reports yet",
      };
    }

    const latest = vibeReports[0];

    return {
      noise: latest.noise_level,
      crowd: latest.crowd_level,
      outlets: latest.outlets,
    };
  }, [vibeReports]);

  async function handleSubmitVibe(e: React.FormEvent) {
    e.preventDefault();

    setSubmittingVibe(true);

    const { data, error } = await supabase
      .from("vibe_reports")
      .insert([
        {
          spot_id: spotId,
          noise_level: noiseLevel,
          crowd_level: crowdLevel,
          outlets,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error submitting vibe report:", error);
      setSubmittingVibe(false);
      return;
    }

    setVibeReports((prev) => [data, ...prev]);
    setSubmittingVibe(false);
  }

  async function handleSubmitSession(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      alert("Please sign in before checking in to study.");
      return;
    }

    if (!displayName.trim() || !subject.trim()) {
      return;
    }

    setSubmittingSession(true);

    const { data, error } = await supabase
      .from("study_sessions")
      .insert([
        {
          spot_id: spotId,
          display_name: displayName,
          subject,
          note: note || null,
          seats_available: seatsAvailable,
          open_to_join: true,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error submitting study session:", error);
      setSubmittingSession(false);
      return;
    }

    setStudySessions((prev) => [data, ...prev]);

    setDisplayName("");
    setSubject("");
    setNote("");
    setSeatsAvailable(1);
    setSubmittingSession(false);
  }

  async function handleEndSession(sessionId: number) {
    const { data, error } = await supabase
      .from("study_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user?.id)
      .select();

    if (error) {
      console.error("Error ending session:", error);
      return;
    }

    if (!data || data.length === 0) {
      console.error("No session was updated.");
      return;
    }

    setStudySessions((prev) =>
      prev.filter((session) => session.id !== sessionId)
    );
  }

  return (
    <div className="space-y-10 p-6">
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Current Vibe</h2>

        <div className="mt-5 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 md:grid-cols-3">
          <VibeStat label="Noise Level" value={currentVibe.noise} />
          <VibeStat label="Crowd Level" value={currentVibe.crowd} />
          <VibeStat label="Outlets" value={currentVibe.outlets} />
        </div>

        <form onSubmit={handleSubmitVibe} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Noise Level"
              value={noiseLevel}
              onChange={setNoiseLevel}
              options={["Silent", "Quiet", "Social"]}
            />

            <SelectField
              label="Crowd Level"
              value={crowdLevel}
              onChange={setCrowdLevel}
              options={["Empty", "Moderate", "Packed"]}
            />

            <SelectField
              label="Outlets"
              value={outlets}
              onChange={setOutlets}
              options={["Unavailable", "Limited", "Available"]}
            />
          </div>

          <button
            type="submit"
            disabled={submittingVibe}
            className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingVibe ? "Reporting..." : "Update Vibe"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Study Sessions</h2>

        <div className="mt-5 space-y-3">
          {studySessions.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
              No active study sessions yet.
            </div>
          ) : (
            studySessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">
                      {session.display_name}
                    </h3>
                    <p className="text-sm text-zinc-600">{session.subject}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.open_to_join && (
                      <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        Open to join
                      </span>
                    )}

                    {session.user_id === user?.id && (
                      <button
                        type="button"
                        onClick={() => handleEndSession(session.id)}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
                      >
                        End
                      </button>
                    )}
                  </div>
                </div>

                {session.note && (
                  <p className="mt-4 text-sm text-zinc-700">{session.note}</p>
                )}

                <p className="mt-3 text-sm text-zinc-500">
                  {session.seats_available} seat
                  {session.seats_available === 1 ? "" : "s"} available
                </p>
              </div>
            ))
          )}
        </div>

        <div
          className={`mt-5 ${
            user
              ? "rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
              : ""
          }`}
        >
          <h3 className="text-base font-semibold text-zinc-900">
            Check In to Study
          </h3>

          {!user ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-900">
                Sign in to create a study session.
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Study sessions are tied to your account so you can manage and end
                your own sessions.
              </p>

              <Link
                href="/auth"
                className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmitSession} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Name"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="e.g. Harjap"
                />

                <InputField
                  label="Subject / Course"
                  value={subject}
                  onChange={setSubject}
                  placeholder="e.g. CSE 331"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-700">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Working on problem set 4"
                  className="mt-2 min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-zinc-700">
                  Seats Available
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={seatsAvailable}
                  onChange={(e) => setSeatsAvailable(Number(e.target.value))}
                  className="mt-2 h-10 w-32 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSession}
                className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingSession ? "Checking In..." : "Check In to Study"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function VibeStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
      />
    </div>
  );
}