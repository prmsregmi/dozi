import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  preferencesApi,
  type UserSettings,
  type PromptTemplate,
} from '@dozi/api-client';
import { ArrowLeft, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  stt_model: 'gpt-4o-transcribe',
  min_silence_duration: 0.5,
  min_speech_duration: 0.1,
  llm_model: 'gpt-5.2',
  transcript_batch_size: 3,
  generation_interval_seconds: 30,
  temperature: 0.3,
  prompt_overrides: null,
};

const STT_MODELS = ['gpt-4o-transcribe', 'gpt-4o-mini-transcribe'];
const LLM_MODELS = ['gpt-5.2', 'gpt-4o', 'gpt-4o-mini'];
const MODES = ['meeting', 'call', 'interview'] as const;

function Section({
  title,
  children,
  defaultOpen = true,
  onReset,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4"
      >
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <div className="flex items-center gap-2">
          {onReset && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onReset();
                }
              }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </span>
          )}
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm text-slate-500 tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [promptDefaults, setPromptDefaults] = useState<Record<string, PromptTemplate>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([preferencesApi.get(), preferencesApi.getPromptDefaults()])
      .then(([prefs, defaults]) => {
        // Merge saved settings over defaults
        setSettings({ ...DEFAULT_SETTINGS, ...prefs.settings });
        setPromptDefaults(defaults);
      })
      .catch((err) => {
        console.error('[Settings] Failed to load:', err);
        setError('Failed to load settings');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await preferencesApi.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('[Settings] Failed to save:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getPromptOverride = (mode: string, field: 'system_message' | 'user_message') => {
    return settings.prompt_overrides?.[mode]?.[field] ?? '';
  };

  const setPromptOverride = (
    mode: string,
    field: 'system_message' | 'user_message',
    value: string
  ) => {
    setSettings((prev) => {
      const overrides = { ...(prev.prompt_overrides ?? {}) };
      overrides[mode] = {
        system_message: overrides[mode]?.system_message ?? null,
        user_message: overrides[mode]?.user_message ?? null,
        [field]: value || null,
      };

      // Remove the mode entry if both fields are null
      if (!overrides[mode].system_message && !overrides[mode].user_message) {
        delete overrides[mode];
      }

      return {
        ...prev,
        prompt_overrides: Object.keys(overrides).length > 0 ? overrides : null,
      };
    });
  };

  const resetTranscription = () => {
    update('stt_model', DEFAULT_SETTINGS.stt_model);
    update('min_silence_duration', DEFAULT_SETTINGS.min_silence_duration);
    update('min_speech_duration', DEFAULT_SETTINGS.min_speech_duration);
  };

  const resetBattleCard = () => {
    update('llm_model', DEFAULT_SETTINGS.llm_model);
    update('transcript_batch_size', DEFAULT_SETTINGS.transcript_batch_size);
    update('generation_interval_seconds', DEFAULT_SETTINGS.generation_interval_seconds);
    update('temperature', DEFAULT_SETTINGS.temperature);
  };

  const resetPrompts = () => {
    update('prompt_overrides', null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 -ml-1.5 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-500">Configure transcription, AI, and prompts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Transcription Settings */}
        <Section title="Transcription" onReset={resetTranscription}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">STT Model</label>
            <select
              value={settings.stt_model}
              onChange={(e) => update('stt_model', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {STT_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <SliderField
            label="Min silence duration"
            value={settings.min_silence_duration}
            min={0.2}
            max={1.0}
            step={0.1}
            unit="s"
            onChange={(v) => update('min_silence_duration', v)}
          />

          <SliderField
            label="Min speech duration"
            value={settings.min_speech_duration}
            min={0.05}
            max={0.5}
            step={0.05}
            unit="s"
            onChange={(v) => update('min_speech_duration', v)}
          />
        </Section>

        {/* Battle Card Generation */}
        <Section title="Battle Card Generation" onReset={resetBattleCard}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">LLM Model</label>
            <select
              value={settings.llm_model}
              onChange={(e) => update('llm_model', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {LLM_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Transcript batch size</label>
              <span className="text-sm text-slate-500 tabular-nums">
                {settings.transcript_batch_size}
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.transcript_batch_size}
              onChange={(e) =>
                update(
                  'transcript_batch_size',
                  Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                )
              }
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Number of new transcripts before generating insights (1–10)
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Generation interval
              </label>
              <span className="text-sm text-slate-500 tabular-nums">
                {settings.generation_interval_seconds}s
              </span>
            </div>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.generation_interval_seconds}
              onChange={(e) =>
                update(
                  'generation_interval_seconds',
                  Math.max(5, Math.min(120, parseInt(e.target.value) || 5))
                )
              }
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Max seconds between generations if new transcripts exist (5–120)
            </p>
          </div>

          <SliderField
            label="Temperature"
            value={settings.temperature}
            min={0}
            max={1}
            step={0.1}
            onChange={(v) => update('temperature', v)}
          />
        </Section>

        {/* Prompt Configuration */}
        <Section title="Prompt Configuration" defaultOpen={false} onReset={resetPrompts}>
          <p className="text-sm text-slate-500 mb-4">
            Override the default prompts per mode. Leave blank to use the built-in defaults.
            The <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{'{transcript}'}</code>{' '}
            placeholder will be replaced with the conversation text.
          </p>

          {MODES.map((mode) => (
            <div key={mode} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-800 capitalize">{mode}</h4>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  System Message
                </label>
                <textarea
                  rows={2}
                  value={getPromptOverride(mode, 'system_message')}
                  onChange={(e) => setPromptOverride(mode, 'system_message', e.target.value)}
                  placeholder={promptDefaults[mode]?.system_message ?? 'Default system message'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  User Message Template
                </label>
                <textarea
                  rows={6}
                  value={getPromptOverride(mode, 'user_message')}
                  onChange={(e) => setPromptOverride(mode, 'user_message', e.target.value)}
                  placeholder={promptDefaults[mode]?.user_message ?? 'Default user message'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono resize-y"
                />
              </div>
            </div>
          ))}
        </Section>

        {/* Save bar */}
        <div className="sticky bottom-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg px-6 py-4 flex items-center justify-between">
            <div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {saved && <p className="text-sm text-green-600">Settings saved</p>}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
