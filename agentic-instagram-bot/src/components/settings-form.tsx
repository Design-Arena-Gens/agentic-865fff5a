'use client';

import { useMemo, useState, useTransition } from "react";

type SettingsFormProps = {
  config: {
    accessToken: string;
    instagramBusinessAccountId: string;
    verifyToken: string;
    followerMessage: string;
    likeMessage: string;
    followerAutomationEnabled: boolean;
    likeAutomationEnabled: boolean;
  } | null;
};

type FormState = {
  accessToken: string;
  instagramBusinessAccountId: string;
  verifyToken: string;
  followerMessage: string;
  likeMessage: string;
  followerAutomationEnabled: boolean;
  likeAutomationEnabled: boolean;
};

const FOLLOWER_TEMPLATE =
  "Hey {{username}}, thanks for the follow! Let me know what kind of content you'd like to see more of 👋";

const LIKE_TEMPLATE =
  "Appreciate the love on my latest post, {{username}}! If you have any questions just drop them here.";

export function SettingsForm({ config }: SettingsFormProps) {
  const [formState, setFormState] = useState<FormState>(() =>
    config
      ? {
          accessToken: config.accessToken,
          instagramBusinessAccountId: config.instagramBusinessAccountId,
          verifyToken: config.verifyToken,
          followerMessage: config.followerMessage,
          likeMessage: config.likeMessage,
          followerAutomationEnabled: config.followerAutomationEnabled,
          likeAutomationEnabled: config.likeAutomationEnabled,
        }
      : {
          accessToken: "",
          instagramBusinessAccountId: "",
          verifyToken: "",
          followerMessage: FOLLOWER_TEMPLATE,
          likeMessage: LIKE_TEMPLATE,
          followerAutomationEnabled: true,
          likeAutomationEnabled: true,
        },
  );

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = useMemo(() => {
    if (!config) {
      return true;
    }

    return (
      config.accessToken !== formState.accessToken ||
      config.instagramBusinessAccountId !==
        formState.instagramBusinessAccountId ||
      config.verifyToken !== formState.verifyToken ||
      config.followerMessage !== formState.followerMessage ||
      config.likeMessage !== formState.likeMessage ||
      config.followerAutomationEnabled !==
        formState.followerAutomationEnabled ||
      config.likeAutomationEnabled !== formState.likeAutomationEnabled
    );
  }, [config, formState]);

  function handleChange(
    field: keyof FormState,
    value: string | boolean,
  ): void {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formState),
        });

        if (!response.ok) {
          const detail = await response.json();
          throw new Error(detail.error ?? "Failed to save settings");
        }

        setSuccessMessage("Settings saved successfully.");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unexpected error occurred.",
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60"
    >
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Instagram Credentials
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Connect an Instagram Business account and define the automation
          message templates. Tokens are stored securely in your own database.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Long-lived Access Token
          </label>
          <input
            type="password"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            value={formState.accessToken}
            onChange={(event) =>
              handleChange("accessToken", event.currentTarget.value)
            }
            placeholder="EAAG..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Instagram Business Account ID
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            value={formState.instagramBusinessAccountId}
            onChange={(event) =>
              handleChange(
                "instagramBusinessAccountId",
                event.currentTarget.value,
              )
            }
            placeholder="178414..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Webhook Verify Token
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            value={formState.verifyToken}
            onChange={(event) =>
              handleChange("verifyToken", event.currentTarget.value)
            }
            placeholder="secret-webhook-token"
            required
          />
        </div>

        <div className="space-y-2 rounded-xl border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          <p className="font-medium text-neutral-600 dark:text-neutral-200">
            Template Tokens
          </p>
          <p>
            Use{" "}
            <code className="rounded bg-neutral-800/10 px-2 py-1 text-xs text-neutral-800 dark:bg-neutral-700/60 dark:text-neutral-200">
              {"{{username}}"}
            </code>{" "}
            to personalize each DM with the follower or liker&apos;s handle.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TemplateField
          label="New follower message"
          value={formState.followerMessage}
          onChange={(value) => handleChange("followerMessage", value)}
          checked={formState.followerAutomationEnabled}
          onToggle={(checked) =>
            handleChange("followerAutomationEnabled", checked)
          }
        />

        <TemplateField
          label="New like message"
          value={formState.likeMessage}
          onChange={(value) => handleChange("likeMessage", value)}
          checked={formState.likeAutomationEnabled}
          onToggle={(checked) => handleChange("likeAutomationEnabled", checked)}
        />
      </div>

      {successMessage && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/60 dark:text-green-200">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/60 dark:text-red-200">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          onClick={() =>
            setFormState((prev) => ({
              ...prev,
              followerMessage: FOLLOWER_TEMPLATE,
              likeMessage: LIKE_TEMPLATE,
            }))
          }
        >
          Reset templates
        </button>
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800/50"
        >
          {isPending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}

type TemplateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  checked: boolean;
  onToggle: (checked: boolean) => void;
};

function TemplateField({
  label,
  value,
  onChange,
  checked,
  onToggle,
}: TemplateFieldProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-neutral-200 bg-white/40 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {label}
          </p>
          <label className="mt-1 inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <input
              type="checkbox"
              className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 dark:border-neutral-600"
              checked={checked}
              onChange={(event) => onToggle(event.currentTarget.checked)}
            />
            Enable automation
          </label>
        </div>
      </div>
      <textarea
        className="min-h-[140px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="Write the DM you want to send..."
      />
    </div>
  );
}
