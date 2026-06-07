# Orçamento do casal

Aplicação local para controlar orçamento por período, categoria, pessoa e lançamentos de gastos.

## Como abrir

Com um terminal nesta pasta:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Depois acesse:

```text
http://127.0.0.1:5173/
```

## Dados

Os dados ficam salvos no próprio navegador usando IndexedDB:

- Banco: `orcamento-do-casal`
- Store: `state`
- Chave: `main`

Use **Exportar** para gerar um arquivo JSON de backup e **Importar** para restaurar esse arquivo depois.

## Recursos

- Períodos editáveis.
- Categorias com divisão por pessoa, ordenação por nome, percentual usado ou criação.
- Paginação de categorias e gastos.
- Gastos com filtro por pessoa.
- Entradas únicas ou mensais com data final opcional.
