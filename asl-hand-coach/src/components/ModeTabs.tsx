export type ModeKey = "teach" | "quiz" | "free";

export default function ModeTabs(props: {
  mode: ModeKey;
  onChange: (m: ModeKey) => void;
}) {
  const { mode, onChange } = props;

  const Tab = (m: ModeKey, label: string) => (
    <button
      className={`tabBtn ${mode === m ? "active" : ""}`}
      onClick={() => onChange(m)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div className="tabs">
      {Tab("teach", "Teaching")}
      {Tab("quiz", "Quiz")}
      {Tab("free", "Free")}
    </div>
  );
}