# Controle Financeiro

Controle financeiro pessoal: registra receitas e despesas, mostra gráficos, orienta
sobre a organização das finanças (regra 50/30/20, tetos por categoria, reserva de
emergência) e simula metas x sobra mensal.

## Dados

Ficam em JSON no armazenamento do navegador do aparelho (sem backend, nada vai para o repositório).
Use a aba **Backup** para exportar/importar um arquivo JSON — é a única cópia de segurança.

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

## Publicação

Cada push na `main` é publicado no GitHub Pages (`.github/workflows/deploy.yml`).
Endereço: https://erikgransiero.github.io/ControleFinanceiro/

## Telas

- **Resumo:** saldo do mês, orientações, gráficos.
- **Lançamentos:** cadastro de receitas e despesas.
- **Categorias:** tipo (fixa/variável), grupo 50/30/20 e teto mensal.
- **Metas:** metas com prazo e simulador.
- **Backup:** exportar/importar JSON.
