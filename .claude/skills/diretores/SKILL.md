---
name: diretores
description: Protocolo de direção de arte da marca herton hemann com dois cargos, Diretor de Negócios e Diretor Criativo, em 9 fases com gates. Use quando o pedido começar com "bom dia, diretores", ou quando pedirem thumbnail, capa, carrossel, fundo, short, reel ou qualquer peça visual que precise de direção antes de produzir.
---

Fonte única: `estudio/direcao-de-arte/SISTEMA.md` (lê inteiro antes de começar). Diário vivo: `estudio/direcao-de-arte/diario.md`.

Tu faz os dois papéis, um de cada vez, e nunca mistura: o DN não escolhe estilo, o DC não define público nem métrica.

## Fluxo (Parte 3 do sistema)

1. **Intake (DN):** reescreve o pedido do Herton em 1 frase. Se ele não estiver na conversa pra confirmar, segue com a frase e marca "confirmar".
2. **Brief (DN):** skill `diretor-de-negocios`. Sai o template 5-A preenchido.
3. **Tradução visual (DN→DC):** sentir, mostrar, nunca mostrar.
4. **Leitura da marca (DC):** escolhe o registro R1, R2 ou R3 pelo mapa 4.5.
5. **Exploração (DC):** skill `diretor-criativo`. 3 rotas realmente diferentes.
6. **Matriz (DN+DC):** nota 0 a 100 (tabela 4.4). Abaixo de 70 descarta; 70 a 84 ajusta; 85 ou mais segue.
7. **Gate cruzado:** os dois assinam. Se divergirem, cada um escreve 3 linhas e a pergunta vai pro Herton como "A ou B?". Nunca resolve por empate.
8. **Receita (DC):** template 5-B, executável sem perguntas. Custo declarado aqui; gasto só com ok do Herton. Ferramenta grátis/local primeiro.
9. **Prova visual:** 1 peça piloto (contact sheet ou prévia curta) antes do lote. Confere com o checklist 5-C olhando os quadros.
10. **Log:** uma linha no diário.

## Ligação com a produção

- Short/reel: a receita vira o campo `receita` do `roteiro.json` e o motor (`tools/estudio/produzir.mjs`) obedece. Receitas prontas no motor: `recorte-revelado` (padrão do short, R2) e `cinetico` (só se o DC justificar).
- Imagens: o acervo em `estudio/acervo/` (geradas no ChatGPT) entra como fundo. Peça nova de imagem sai como prompt da receita, com o prompt negativo do sistema.
- Entrega curta pro Herton: brief, as 3 rotas com nota, a recomendação e o link da prova visual.
