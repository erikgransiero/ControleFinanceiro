import { useRef, useState } from "react";
import type { Db } from "../types";
import { dbInicial, marcarBackup, validar } from "../lib/storage";

interface Props {
  db: Db;
  substituir: (d: Db) => void;
}

export default function Backup({ db, substituir }: Props) {
  const arq = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  function exportar() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `controle-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    marcarBackup();
    setMsg("Backup exportado.");
  }

  async function importar(f: File) {
    try {
      const novo = validar(JSON.parse(await f.text()));
      if (!confirm("Isto substitui TODOS os dados atuais pelos do arquivo. Continuar?")) return;
      substituir(novo);
      setMsg(`Importado: ${novo.lancamentos.length} lançamentos, ${novo.categorias.length} categorias, ${novo.metas.length} metas.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao ler o arquivo.");
    }
  }

  return (
    <div className="stack">
      <section className="painel form">
        <h2>Backup dos dados (JSON)</h2>
        <p className="sub">
          Seus dados ficam apenas neste navegador. Se limpar os dados do Safari, eles se perdem —
          exporte um backup com frequência e guarde no iCloud/Arquivos.
        </p>
        <button className="primario" onClick={exportar}>Exportar backup</button>
        <button onClick={() => arq.current?.click()}>Importar backup</button>
        <input ref={arq} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = ""; }} />
        {msg && <p className="sub">{msg}</p>}
      </section>
      <section className="painel form">
        <h2>Zona de perigo</h2>
        <button className="perigo-btn" onClick={() => confirm("Apagar todos os dados e voltar ao início?") && substituir(dbInicial())}>
          Apagar tudo
        </button>
      </section>
    </div>
  );
}
