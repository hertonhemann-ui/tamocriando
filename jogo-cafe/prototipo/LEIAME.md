# Protótipo dos 5 dias

Arquivo único (`index.html`), roda no navegador. Implementa a etapa 2 do `CONCEITO.md` em versão rascunho: um café, três receitas, uma funcionária, três personagens sociais, cinco dias.

Link jogável: https://claude.ai/artifact/SSGaFWTBBeJBKVcKaKTJtr

## O que tem

| Sistema | No protótipo |
|---|---|
| Operação | Moedor → Máquina → (Vaporizador) → Entrega. Forno assa 4 pães por vez. Fila de até 6 clientes com paciência |
| Gestão | Mover estações (manhã ou no meio do expediente, com tempo a 25%), preço baixo/normal/alto, compras, escala da Bia |
| Vida | Estresse (acima de 50 deixa tu e as estações mais lentos), nível de cozinha, nível de gestão, esgotamento em 85 |
| Relações | Dona Lúcia (cliente fiel), Caio (amigo), Rafa (rival), Bia (funcionária). Afinidade + memória de fatos |
| Eventos | 14 eventos em dados, com gatilho, escolhas, requisitos e consequências agendadas |
| Diretor | Escolhe até 2 eventos por momento do dia, alternando pesado e leve conforme a tensão |
| Diário de causas | Registra decisões e, quando uma volta, mostra de onde veio |
| Final | Epílogo montado a partir do estado. Falência encerra a partida |

## Cadeias de consequência que dá pra provocar

- Recusar a Bia no dia 1 → no dia 3 ela aparece trabalhando no Grão Nobre e o rival puxa parte da tua fila.
- Contratar a Bia e nunca aliviar → ela pede ajuda → se tu pedir pra aguentar, ela pode ir pro Rafa dois dias depois.
- Preço alto com a Dona Lúcia → ela reclama → manter o preço derruba a relação → ela some e o grupo de crochê nunca vem.
- Tratar bem a Dona Lúcia e caminhar com ela → ela conta da padaria que fechou → oferece trazer o grupo (pico de clientes à tarde).
- Sumir das noites com o Caio → ele avisa que o Rafa chamou ele pra tocar → promessa quebrada = show no rival.
- Pedir leite emprestado ao Rafa → ele cobra o favor quando propõe comprar teu pão de queijo.
- Trabalhar sem descansar → esgotamento → perde a manhã.

## Como testar (o que observar)

Peça pra outra pessoa jogar sem explicação. Depois pergunte:

1. Em que momento tu quis abrir o café de novo? (operação diverte?)
2. Mudou alguma estação de lugar? Fez diferença? (gestão importa?)
3. Abriu mão de dinheiro por descanso ou por alguém? (vida importa?)
4. Alguém te ajudou ou te atrapalhou? (relações importam?)
5. Me conta tua semana. (as escolhas viram história? duas pessoas, duas histórias)

## Botões de ajuste

Todos no topo do `<script>`:

| Constante | Valor | Efeito |
|---|---|---|
| `DAY_LEN` | 180 | Duração do expediente em segundos |
| `ALUGUEL` | 40 | Custo fixo diário |
| `SAL` | 35 / 20 | Salário da Bia integral / meio |
| `PRECO_BASE` | 6 / 9 / 5 | Espresso, cappuccino, pão |
| `BASE_T` | 1.6 / 3 / 2.2 / 7 | Tempos das estações |
| base de clientes | 18 × demanda | em `iniciarExpediente` (dia 1 tem 70%) |

## Limites conhecidos

- Arte provisória de propósito. O que está sendo testado é o ciclo, não o visual.
- O progresso salva no começo de cada dia (no navegador de quem joga).
- Balanceamento inicial. Os números foram ajustados com um robô jogando, não com pessoas.
