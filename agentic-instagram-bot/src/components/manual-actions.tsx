'use client';

import { useState, useTransition } from "react";
import { EventType } from "@prisma/client";

type ManualActionsProps = {
  hasConfig: boolean;
};

export function ManualActions({ hasConfig }: ManualActionsProps) {
  const [processResponse, setProcessResponse] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [messageType, setMessageType] = useState<EventType>(EventType.FOLLOW);
  const [manualResult, setManualResult] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [isProcessing, startProcessing] = useTransition();
  const [isSending, startSending] = useTransition();

  const disabled = !hasConfig;

  return (
    <section className="space-y-6 rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Manual controls
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Run the processor on demand and send targeted test messages to verify
          Instagram credentials.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Process pending events
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Attempts to send DMs for any follow or like events that have not
              been processed yet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setProcessResponse(null);
              setProcessError(null);
              startProcessing(async () => {
                try {
                  const response = await fetch("/api/events/process", {
                    method: "POST",
                  });
                  const payload = await response.json();
                  if (!response.ok) {
                    throw new Error(payload.error ?? "Failed to process events");
                  }
                  setProcessResponse(
                    `Processed ${payload.processedCount ?? 0} events.`,
                  );
                } catch (error) {
                  setProcessError(
                    error instanceof Error
                      ? error.message
                      : "Unexpected error while processing events.",
                  );
                }
              });
            }}
            disabled={isProcessing || disabled}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800/50"
          >
            {isProcessing ? "Processing..." : "Run processor"}
          </button>
        </div>
        {processResponse && (
          <p className="mt-3 rounded-md bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/50 dark:text-green-200">
            {processResponse}
          </p>
        )}
        {processError && (
          <p className="mt-3 rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-200">
            {processError}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Send a manual DM
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Use this to run a spot check. The message will send immediately
              using the configured Instagram business account.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Instagram user ID
              </label>
              <input
                value={recipientId}
                onChange={(event) => setRecipientId(event.currentTarget.value)}
                placeholder="User ID"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Event type
              </label>
              <select
                value={messageType}
                onChange={(event) =>
                  setMessageType(event.currentTarget.value as EventType)
                }
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <option value={EventType.FOLLOW}>Follower message</option>
                <option value={EventType.LIKE}>Like message</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
              Override message (optional)
            </label>
            <textarea
              value={manualMessage}
              onChange={(event) =>
                setManualMessage(event.currentTarget.value ?? "")
              }
              placeholder="Leave empty to use the saved template"
              className="min-h-[120px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setRecipientId("");
                setManualMessage("");
                setManualResult(null);
                setManualError(null);
              }}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={isSending || disabled || !recipientId}
              onClick={() => {
                setManualResult(null);
                setManualError(null);
                startSending(async () => {
                  try {
                    const response = await fetch("/api/messages/send", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        recipientId,
                        messageType,
                        message: manualMessage,
                      }),
                    });
                    const payload = await response.json();
                    if (!response.ok) {
                      throw new Error(payload.error ?? "Failed to send DM");
                    }
                    setManualResult(
                      `Message sent (log id: ${payload.logId ?? "n/a"}).`,
                    );
                  } catch (error) {
                    setManualError(
                      error instanceof Error
                        ? error.message
                        : "Unexpected error while sending DM.",
                    );
                  }
                });
              }}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800/50"
            >
              {isSending ? "Sending..." : "Send DM"}
            </button>
          </div>
        </div>
        {manualResult && (
          <p className="mt-3 rounded-md bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/50 dark:text-green-200">
            {manualResult}
          </p>
        )}
        {manualError && (
          <p className="mt-3 rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-200">
            {manualError}
          </p>
        )}
      </div>
      {!hasConfig && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-200">
          Configure your Instagram credentials above to enable manual controls.
        </p>
      )}
    </section>
  );
}
