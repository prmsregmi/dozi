// Placeholder landing spot after onboarding completes. The real camera +
// ML coaching view will replace this component once merged into that repo.
export default function CameraPlaceholder() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center px-6 gap-3">
      <span className="text-3xl">🎥</span>
      <p className="text-white font-semibold">Camera coming soon</p>
      <p className="text-slate-400 text-sm max-w-[260px]">
        This is where live camera coaching will start.
      </p>
    </div>
  );
}
