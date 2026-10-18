import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemeMode } from "../../theme/ThemeProvider";
const modes = [
  { id: "light", label: "Claro", Icon: Sun },
  { id: "dark", label: "Oscuro", Icon: Moon },
  { id: "system", label: "Sistema", Icon: Monitor },
] as const;
export function AppearanceSettings() {
  const { mode, setMode } = useTheme();
  return (
    <section className="profile-section" aria-labelledby="appearance-heading">
      <div className="profile-section-heading">
        <Moon size={20} />
        <div>
          <h2 id="appearance-heading">Apariencia</h2>
          <p>
            Elige cómo prefieres trabajar. Recordaremos tu elección en este
            navegador.
          </p>
        </div>
      </div>
      <div className="theme-options" role="group" aria-label="Tema del panel">
        {modes.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => setMode(id as ThemeMode)}
          >
            <span className={`theme-swatch swatch-${id}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <Icon size={16} />
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
