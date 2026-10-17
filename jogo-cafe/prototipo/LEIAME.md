# Protótipo dos 5 dias (v3)

Arquivo único (`index.html`), roda no navegador. Link jogável: https://claude.ai/artifact/SSGaFWTBBeJBKVcKaKTJtr

## O que mudou na v3

**Estrutura**
- Menu principal: Continuar, Novo jogo, Carregar, Som e Fechar.
- Menu dentro do jogo (botão Menu ou `Esc`): voltar, salvar em 3 espaços, carregar, som, sair para o menu principal e fechar.
- Salvamento automático no começo de cada manhã e de cada noite. Durante o expediente o menu pausa o jogo, mas não salva o meio do dia.

**Motivo pra continuar jogando**
- **Objetivo da semana:** pagar a parcela de R$ 300 à Dona Cida na sexta. O topo da tela mostra quanto falta. Cada compra de melhoria disputa esse dinheiro.
- **Metas do dia:** três por dia, cada uma com bônus em dinheiro e uma estrela. O fim do dia mostra de 0 a 3 estrelas.
- **Combo:** clientes atendidos a tempo, em sequência, multiplicam a gorjeta (x1,5 no 3, x2 no 6, x3 no 10). Um cliente irritado zera.
- **Ponto perfeito:** nas etapas de mão (moer, chocolate, vaporizar), tocar de novo quando o cursor passa pela faixa verde deixa o item perfeito (★). Item perfeito rende gorjeta extra.
- **Clientes com traço:** apressado (espera pouco, paga mais), exigente (só aceita bebida perfeita) e generoso (gorjeta em dobro).
- **Especialidades:** ao subir Cozinha ou Atendimento para o nível 1 ou 2, tu escolhe uma entre duas especialidades.
- **Receita nova no meio da semana:** o Mocha, achado no caderno da Dona Cida na quarta. Tem 4 etapas e custa R$ 12.

**Visual e som**
- Cena com mais resolução, luz das luminárias, luz da janela mudando com a hora, sombras, vinheta e degradês com dithering.
- Personagens maiores, com sombreado e expressão (sorriem atendidos, franzem a testa quando a paciência acaba).
- Ícones pixel dos itens nos pedidos, na bandeja, nos botões e nos balões acima dos clientes.
- Textos corridos numa fonte de alta legibilidade. A fonte pixel fica só para títulos e números.
- Efeitos sonoros (moedor, vapor, caixa, combo, meta, erro) e textos flutuantes de dinheiro, combo e "PERFEITO!". A tela treme quando alguém vai embora irritado.

## Atalhos

`Q` espresso · `W` cappuccino · `E` mocha · `1`–`4` etapa de mão no preparo · `espaço` acertar o ponto · `F` assar · `Z X C V B` entregar · `Esc` menu

## O que a pesquisa disse (e onde entrou)

| Fonte | Ideia | No jogo |
|---|---|---|
| Estudos de *game feel* e *juice* | Toda ação precisa de resposta audiovisual, mas em cima de um núcleo que já funciona | Sons, textos flutuantes, tremida, animação na bandeja |
| Cook, Serve, Delicious | O vício vem da sequência de pedidos perfeitos e do som de cada etapa | Combo, ponto perfeito, dia com 3 estrelas |
| Coffee Talk | Cortar o que não é essencial; a história avança pelo jeito de servir | Clientes exigentes, Dona Lúcia reage a como foi atendida |
| Guias de onboarding | Os primeiros minutos precisam de propósito claro e de uma escolha cedo | Parcela de sexta desde a primeira fala, metas visíveis, escolha da Bia no fim do dia 1 |
| Críticas ao Punch Club | O risco do gênero é virar uma rotina de grind | Metas variam todo dia, receita nova na quarta, eventos com consequência |
| Técnicas de pixel art 16 bits | Uma direção de luz, sombras em tons frios, dithering nos degradês | Luminárias âmbar, sombras roxas, céu e parede com dithering |

## Como testar

1. O tutorial deixou claro o que fazer? Acertou o ponto perfeito?
2. Em que momento tu quis jogar mais um dia?
3. A parcela de sexta mudou o jeito de gastar?
4. Combo e metas deram vontade de jogar melhor?
5. Me conta tua semana.
