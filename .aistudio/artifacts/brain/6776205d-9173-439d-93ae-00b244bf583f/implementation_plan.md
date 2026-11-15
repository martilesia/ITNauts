# Space Base Commander — Auditoria Pedagógica e Plano de Aprendizagem Activa

Transformação do sistema educativo das 5 missões para que cada actividade siga um ciclo experiencial de causa-efeito (Situação → Exploração → Decisão → Consequência Visual → Reflexão com ASTRO → Aplicação), com memória persistente das decisões do jogador e recuperação não-punitiva, sem questionários nem blocos de texto expositivo.

---

## Revisão e Decisões Críticas

> [!IMPORTANT]
> Este plano audita todas as actividades actuais e propõe o redesenho experiencial e técnico antes de qualquer alteração de código. Revê as tabelas e fluxos abaixo e confirma para iniciarmos a implementação missão a missão.

- **Identidade e Cenário Preservados**: Todas as 5 missões mantêm o mundo 3D em tempo real no destino escolhido pelo jogador (Lua ou Marte), preservando a personalização inclusiva, a física de gravidade e os controlos já activos.
- **Aprendizagem Sem Questionários**: Nenhuma verificação de aprendizagem usará perguntas de escolha múltipla; todas as validações ocorrem pela observação do comportamento em simulação (construção, selecção de materiais, gestão de energia, posicionamento de colectores e ajuste hídrico).
- **Memória Inter-Missões**: As escolhas científicas do jogador (material térmico, blindagem anti-poeira, reserva de energia, qualidade do local da base e água purificada armazenada) serão registadas no estado global da campanha e terão impacto real nas missões seguintes.
- **Dados Claramente Simulados**: Todos os valores de temperatura, humidade (Região A 8%, B 32%, C 45%), precipitação/gelo e relevo mantêm identificação explícita como dados simulados de treino inspirados em conceitos científicos reais.

---

## 1. Visão Geral e Diagnóstico Actual

- **Público-Alvo**: Crianças dos 7 aos 12 anos em Português Europeu.
- **Diagnóstico da Arquitectura Actual**:
  - **Missão 1** funciona hoje sobretudo como "calibração por tentativa/erro até acertar o alvo": o jogador arrasta a lente até ao equador ou ajusta dois sliders até ficarem verdes, mas não aplica a descoberta numa experiência subsequente com consequências reais.
  - **Missão 2** já possui boa simulação de balanço energético e reparação, mas a tempestade não provoca falhas graduais se o jogador adiar escolhas ou desligar sistemas críticos por engano, e falta uma decisão clara de priorização/protecção antes de o dano ocorrer.
  - **Missão 3** bloqueia simplesmente cliques fora da zona plana no modo construção (com toast vermelho) e não modela consumo de energia do rover em terreno acidentado nem permite ao jogador observar a estrutura a inclinar-se/instabilizar antes de decidir relocalizar.
  - **Missão 4** tem medição de zonas e instalação de extrator/canal/filtro, mas impede avançar sem a sequência exacta ou apenas mostra alerta verbal sem demonstrar visualmente a diferença entre água recolhida bruta (turva/imprópria) vs. água purificada para a base.
  - **Missão 5** possui sondagem e cultivo nas regiões A (8%), B (32%) e C (45%), mas permite construir directamente com ajuste rígido e ainda não liga a água purificada da Missão 4 nem mostra a evolução visual gradual das plantas perante secura ou encharcamento antes de o jogador corrigir.

---

## 2. FASE 1 — Auditoria Pedagógica das 5 Missões

### Tabela Completa de Planeamento Educativo

| Missão & Actividade | Conceito Científico | O Que a Criança Deve Aprender | Decisões Disponíveis | Consequências Positivas | Consequências Negativas (Reversíveis) | Forma de Feedback (Visual + ASTRO) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1 · Sensor Térmico (MODIS)** | Radiação solar, contraste térmico entre sombra/luz e isolamento térmico de materiais | Regiões diferentes têm temperaturas extremas; materiais reagem de forma distinta ao calor e frio extremos | Explorar mapa térmico (crateras frias vs. equador quente) e escolher material do abrigo experimental (Refletor Dourado, Metal Escuro Fino, Plástico Leve) | Abrigo mantém temperatura interna estável; desbloqueia bónus de eficiência térmica na base da M2 | Metal fino sobreaquece/gela o módulo na simulação (termómetro dispara e módulo vibra/cintila) | Termómetro animado em tempo real + alteração de cor/vapor no abrigo 3D + reacção contextual de ASTRO e possibilidade imediata de trocar material |
| **M1 · Poeira & Aerossóis (MERRA-2)** | Partículas suspensas e dispersão atmosférica/eletrostática | Existem partículas invisíveis a olho nu cuja densidade e fluxo mudam consoante a zona e o filtro | Sintonizar espectro de leitura, identificar densidade de partículas numa zona limpa vs. densa e escolher tipo de filtro para o fato/escudo | Captura limpa do fluxo e desbloqueio de pré-proteção contra poeira para a Missão 2 | Filtro subdimensionado entope rapidamente na câmara de teste (partículas acumulam-se no visor) | Simulação animada de partículas a colidir/atravessar o filtro + indicador visual de saturação + ASTRO sugere testar outro filtro |
| **M1 · Relevo (SRTM / LOLA / MOLA)** | Altimetria, declive e estabilidade estrutural | Zonas planas, vales fundos e encostas íngremes comportam-se de forma diferente ao suportar estruturas | Manipular o perfil topográfico em corte 2.5D/3D e posicionar o repetidor experimental em pico, vale estreito ou planalto | Sinal forte e antena direita sem oscilações; regista referência topográfica para a M3 | Em pico exposto oscila ao vento/sem apoio; no vale o feixe de rádio bate nas encostas e perde sinal | Feixes de onda rádio bloqueados vs. livres + inclinação visível da mini-torre + ASTRO explica o porquê e deixa reposicionar |
| **M1 · Precipitação / Reservas Hídricas (GPM)** | Distribuição desigual de precipitação/gelo por região | A quantidade de chuva ou gelo varia muito entre regiões áridas, encostas e zonas polares/húmidas | Analisar 3 regiões com o sensor e posicionar um pequeno colector experimental para testar captação durante 1 ciclo | Coletor na zona rica enche rapidamente o frasco de ensaio; fornece dados iniciais para a M4 | Coletor em zona árida recolhe apenas algumas gotas no fundo do frasco transparente | Frasco transparente animado com nível de água real após 3s de ciclo + ASTRO comenta a diferença entre regiões e permite mover |
| **M1 · Humidade do Solo (SMAP)** | Humidade retida no solo vs. água superficial/chuva | Chuva/gelo superficial não garante solo equilibrado; cada solo retém água de modo diferente | Sondar solo arenoso seco, solo equilibrado e solo saturado/encharcado e plantar uma semente experimental num dos três | Semente germina verdejante com raízes firmes no solo equilibrado | No seco a semente não brota; no encharcado as raízes afogam em água estagnada | Corte transversal animado de solo + raízes/folhas da semente + ASTRO sublinha a diferença e convida a replantar noutro vaso |
| **M2 · Escudo, Energia e Reparações** | Gestão de energia limitada, protecção preventiva e manutenção de suporte de vida | Preparar equipamentos antes/durante adversidades evita avarias; energia limitada obriga a priorizar sistemas vitais | Decidir que sistemas manter ativos no Quadro de Energia, usar o Escudo Protetor (Estufa vs. Antena), limpar painéis solares e reparar fugas com a chave | Bateria estabiliza em balanço positivo; estufa intacta; oxigénio recupera; bónus se aplicou aprendizagens térmicas/filtro da M1 | Desligar O2 baixa oxigénio no habitat; deixar holofotes/radar drena bateria até falha temporária de luzes; adiar escudo da estufa reduz vitalidade das plantas | Luzes do habitat atenuam, alarme visual suave de O2, contador de watts em tempo real, placas de poeira na estufa + ASTRO guia a correcção sem bloquear |
| **M3 · Percurso do Rover & Amostras** | Atrito/inclinação do terreno, gasto energético e geologia local | Subir encostas e contornar obstáculos gasta mais energia e tempo; amostras revelam a qualidade do solo para construir | Escolher rota (corta-mato por encosta íngreme vs. corredor plano), sair do rover para analisar amostras em vez de só recolher, e ler estabilidade do solo | Rota planeada conserva bateria do rover (chega com reserva energética extra); análise das 3 amostras revela índice de compactação do planalto | Subir encostas íngremes drena bateria do rover mais depressa e obriga a pausa de recarga solar; avançar às cegas sem scanner arrisca cair em depressões | Barra dinâmica de energia do rover ligada ao declive atual + leitura visual da textura/compactação de cada amostra + ASTRO reage ao consumo |
| **M3 · Construção da Base 3D** | Influência da topografia e inclinação na engenharia civil espacial | Estruturas precisam de solo plano e compacto; declives e crateras provocam instabilidade física | Posicionar os 4 módulos livremente no terreno (incluindo testar zonas inclinadas ou bordas de cratera!) e depois reposicionar/corrigir | No planalto ideal, os módulos assentam nivelados, ligam cabos verdes e geram 100% de estabilidade/eficiência | Em zona inclinada ou cratera o módulo **é colocado**, mas surge inclinado, com luz âmbar intermitente e eficiência reduzida até ser movido | Módulo 3D inclina fisicamente conforme o declive, cabos piscam âmbar + indicador "Estabilidade da Base" + botão/clique para **Relocalizar Módulo** |
| **M4 · Captação de Água / Gelo & Purificação** | Distribuição espacial/temporal de precipitação/gelo e potabilidade da água | O local e período determinam a quantidade captada; água recolhida da chuva/gelo ainda contém impurezas e não é logo potável | Escolher localização do colector (Árida, Moderada ou Polar), construir canal e testar distribuição de água **bruta** vs. ativar **Purificador** | Coletor na zona mais rica enche o tanque; activar purificador transforma água turva em azul límpida, desbloqueando reserva potável para a Missão 5 | Em zona seca o tanque quase não sobe (ex.: 12%); ligar o canal sem filtro enche o tanque de **água turva/salobra** que não serve para consumo | Cor real da água no tanque 3D/HUD (castanha/turva sem filtro vs. cristalina com filtro), fluxo lento vs. rápido no tubo + ASTRO explica potabilidade e permite mover/filtrar |
| **M5 · Análise SMAP (8%, 32%, 45%) e Biodomo** | Estimativa de humidade por micro-ondas (SMAP simulado) e equilíbrio hídrico no cultivo | Humidade baixa seca as plantas e humidade excessiva sufoca as raízes; dados orbitais simulados orientam o cultivo e a rega | Lançar satélite SMAP simulado, sondar Regiões A (8%), B (32%) e C (45%), escolher local do biodomo, ligar rega/drenagem e usar água guardada da M4 | Região B (ou A com rega / C com drenagem) faz plantas crescerem viçosas; usar água da M4 dá arranque imediato ao reservatório | Plantar em A (8%) sem rega murcha as folhas; plantar em C (45%) sem drenagem cria poças e raízes escuras; regar em cima de 45% piora saturação | Evolução visual progressiva da planta em 4 estados (murcha seca / saudável verde / saturada caída) + medidor de micro-ondas simulado + ASTRO incentiva ajustar estratégia |

---

## 3. FASE 2 — Redesign Educativo Integrado no Gameplay

O fluxo de cada actividade passa a seguir o **Ciclo Pedagógico de 6 Passos** sem abrir questionários:

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   ┌───────────────┐   ┌──────────────┐
│ 1. SITUAÇÃO  │─▶│ 2. EXPLORAÇÃO│─▶│  3. DECISÃO  │─▶│ 4. CONSEQUÊNCIA  │─▶│ 5. REFLEXÃO   │─▶│ 6. APLICAÇÃO │
│ Problema ou  │   │ Medir c/     │   │ Escolher     │   │ Mudança física   │   │ Frase curta e │   │ Usar dado ou │
│ oportunidade │   │ instrumento  │   │ local/ação   │   │ na cena / estado │   │ contextual    │   │ corrigir     │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────────┘   └───────────────┘   └──────────────┘
```

### Exemplos Concretos por Missão

#### Missão 1 — *O Chamamento Espacial* (Descoberta → Experiência Prática)
Cada uma das 5 bancadas ganha um **Passo 2 de Aplicação Prática** dentro do mesmo laboratório visual (sem questionário):
- **MODIS (Temperatura)**: Após explorar o mapa térmico e descobrir que a zona iluminada é extrema e a polar é gélida, o jogador testa **3 materiais de revestimento** num mini-abrigo experimental (Manta Refletora Dourada, Chapa Escura Fina, Polímero Simples). Se escolher chapa escura fina sob radiação direta, o termómetro do abrigo dispara e o painel fica vermelho; ASTRO reage: *"A chapa escura absorveu calor demais! Queres experimentar a manta que reflete a luz?"* Ao acertar, a escolha fica memorizada como **Revestimento Térmico da Base**.
- **MERRA-2 (Poeira/Aerossóis)**: Após sintonizar o fluxo, testa dois filtros (Malha Larga vs. Filtro Eletrostático Fino) na câmara de vento e vê os grãos atravessar ou ficar retidos.
- **SRTM / LOLA / MOLA (Relevo)**: O jogador pode **instalar o repetidor em qualquer ponto do perfil** (incluindo pico ou vale!). No vale, o feixe de sinal animado bate nas paredes do desfiladeiro; no pico, o vento faz a torre oscilar. Só no planalto o feixe atinge o satélite limpo, podendo mover quantas vezes quiser.
- **GPM (Água/Gelo)**: Após colocar o colector numa zona, corre uma **simulação de 3 segundos de precipitação/condensação**: na zona árida o medidor sobe apenas ~8% e ASTRO reage: *"Quase não caiu nada aqui! Que tal testarmos noutra região?"*
- **SMAP (Solo)**: Depois de medir os 3 solos, planta uma semente num deles para observar durante 3 segundos se germina, seca ou afoga — compreendendo antes de chegar à Missão 5 que água em excesso também prejudica.

#### Missão 2 — *Operação: Escudo da Base* (Consequências em Cadeia & Recuperação)
- **Priorização de Energia**: Se o jogador deixar Holofotes + Radar ligados ou desligar o Suporte de Vida (O2) para "poupar watts", as consequências aparecem de imediato: a bateria desce para reserva crítica (luzes da base ficam âmbar/baixas) ou o O2 cai e ASTRO alerta com preocupação (*"Sem o suporte de vida o oxigénio está a descer! Liga-o primeiro e desliga os holofotes lá fora."*).
- **Previsão & Preparação**: Logo no início surge uma **janela de preparação de 20 segundos** antes do pico da tempestade (com barra visual de aproximação da frente de poeira). Se o jogador fechar o escudo da estufa antes do pico, as plantas permanecem a 100% de saúde e o jogador ganha eficiência; se não proteger a tempo, a poeira cobre a cúpula da estufa e o jogador precisa de **limpar e reparar** a estufa antes de prosseguir — transformando a omissão numa consequência física recuperável.
- **Ligação à Missão 1**: Se na Missão 1 escolheu o **Revestimento Térmico Refletor** e o **Filtro Eletrostático**, ASTRO nota no início da M2 que o habitat perde menos energia e os painéis demoram mais a acumular poeira!

#### Missão 3 — *Terrain Explorer* (Energia do Rover + Engenharia Realista)
- **Percurso do Rover com Bateria Física**: O rover passa a ter uma **bateria de expedição** (ex.: 100%, com recarga automática por painel solar se parar 3s ao sol). Atravessar **encostas íngremes (29°)** consome **3× mais energia** por metro e abranda o rover; circular nas planícies moderadas consome 1×. Se a bateria chegar a 10%, entra em **Modo Poupança Solar** (recarga automática rápida de 3s com animação solar para nunca bloquear a criança!), enquanto ASTRO explica: *"Subir aquela encosta gastou imensa bateria! Pelos vales planos o rover gasta muito menos."*
- **Análise das 3 Amostras**: Ao recolher cada amostra, o scanner portátil exibe visualmente a textura (porosa, rocha solta ou rególito compacto), dando pistas visuais sobre onde o solo suportará melhor uma base.
- **Construção com Consequência Física (Em Vez de Bloqueio)**: No modo construção, o jogador pode **colocar os módulos onde quiser** (encosta, cratera ou planalto verde).
  - Se colocar numa encosta ou cratera, o módulo 3D **inclina fisicamente** no terreno, emite um aviso âmbar de instabilidade e a **Estabilidade da Base** fica baixa (ex.: 45%), impedindo a conclusão segura.
  - ASTRO reage: *"Repara como o Habitat ficou inclinado nesta encosta! Queres movê-lo para o planalto plano a Leste?"*
  - O jogador pode **clicar num módulo já colocado para o recolher/relocalizar** para o planalto plano, vendo o módulo endireitar-se, os cabos ficarem verdes e a Estabilidade subir para 100%.

#### Missão 4 — *Water & Ice Explorer* (Captação Desigual + Lição da Água Bruta vs. Potável)
- **Experimentação Livre de Localização**: O jogador pode instalar o extrator/coletor **em qualquer região e em qualquer fase**, sem bloqueio artificial.
  - Se colocar na zona árida (Equador), a simulação funciona, o tubo liga-se, mas o tanque enche apenas a **10–18%**. ASTRO comenta: *"Ops! Aqui quase não há água/gelo. O reservatório mal encheu. Vamos tentar mover o extrator para outro local?"* (com botão claro **Mover Extrator**).
- **Água Bruta vs. Água Potável**: Se o jogador construir o canal e abrir o fluxo **antes** de activar o Purificador, o tanque começa a encher com **água turva/mineralizada** (barra e visor castanho-turvo com ícones de sedimentos). ASTRO intervém: *"Apanhámos muita água, mas tem poeira e minerais! Ainda não se pode beber. Vamos ligá-la ao Filtro Purificador?"* Só após filtrar o reservatório fica azul cristalino e armazenado na **Memória da Campanha**.

#### Missão 5 — *Soil & Biodome Explorer* (Dados SMAP Simulados + Impacto Real nas Plantas)
- **Uso da Água da Missão 4**: Ao construir o reservatório do biodomo, se a criança concluiu a Missão 4 com água purificada cheia, o sistema recebe automaticamente **Reserva da Missão 4 (+água limpa pronta)**; caso contrário, começa vazio e precisa de captar/ajustar mais.
- **Resposta Orgânica das Plantas às Escolhas (8%, 32%, 45%)**:
  - Permite plantar **em qualquer uma das 3 regiões (A: 8%, B: 32%, C: 45%)** mesmo sem aviso prévio.
  - **Consequência em Região A (8%) sem rega**: A terra abre fendas secas, a muda nasce amarelada/murcha com barra de hidratação crítica; ASTRO explica: *"Com só 8% de humidade simulada no solo, as raízes não têm água! Experimenta ligar a rega suave ou mudar o biodomo para a Região B."*
  - **Consequência em Região C (45%) sem drenagem**: Aparece água estagnada à volta das raízes e folhas caídas escuras; ASTRO explica: *"45% é água a mais — as raízes não conseguem respirar! Liga a drenagem ou experimenta a Região B (32%)."* (Se ligar "Regar" nos 45%, a saturação sobe para ~67% e piora o alagamento, ensinando causa-efeito directa).
  - **Correcção e Sucesso**: Sem reiniciar a missão, o jogador pode **ajustar Regar / Drenar** ou **trocar de região** e observar as plantas a ficarem verdes e saudáveis em tempo real!

---

## 4. FASE 3 — Planeamento Técnico e Arquitectura

### Fluxo de Estado, Memória e Motor de Consequências

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GameContext (Estado Persistente)                     │
│  save.campaignMemory:                                                   │
│   ├─ m1ThermalMaterial: 'reflective' | 'dark-metal' | 'polymer'         │
│   ├─ m1DustFilter: 'electrostatic' | 'coarse-mesh'                      │
│   ├─ m2EnergyReservePct / m2GreenhouseIntegrity                         │
│   ├─ m3RoverBatteryRemaining / m3BaseStabilityPct / m3SteepAttempts     │
│   ├─ m4PurifiedWaterLiters / m4TestedPoorZone / m4BuiltRawFirst         │
│   ├─ m5SoilRegionChosen / m5AdjustedStrategy                            │
│   └─ learningBehavior: { exploredCount, adaptedAfterFeedback, ... }     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ lê bónus / histórico & grava decisões
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           Motor Reutilizável de Aprendizagem Activa (Hook/Utils)        │
│  usePedagogicalCycle():                                                 │
│   ├─ registo de tentativa (explore -> decide -> evaluate -> consequence) │
│   ├─ gera reacção variada do ASTRO conforme contexto & histórico        │
│   ├─ contabiliza aprendizagem comportamental (sem questionários!)       │
│   └─ suporta "Rever Decisão / Corrigir" sem perda punitiva             │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ alimenta simulações & cena 3D
                                ▼
┌────────────────────────────────────┬────────────────────────────────────┐
│    Simulações & UI das Missões     │         SpaceViewport3D            │
│  • Painéis de consequência visual  │  • Inclinação física de módulos    │
│    (água turva vs limpa, plantas   │    colocados em declives (M3)      │
│    murchas vs viçosas, termómetro) │  • Cor da água no tanque 3D (M4)   │
│  • Botões de correcção imediata    │  • Saúde visual das plantas 3D (M5)│
│    ("Mover", "Filtrar", "Regar")   │  • Luzes de emergência (M2)        │
└────────────────────────────────────┴────────────────────────────────────┘
```

### Estratégia de Integração na Arquitectura Existente

1. **Extensão Limpa do Estado Global (`GameSaveState`)**:
   - Adicionar um objeto tipado `campaignMemory` (com valores por defeito retrocompatíveis para saves existentes no `localStorage`) que guarda decisões relevantes, tentativas revistas e indicadores comportamentais (ex.: se o jogador explorou antes de decidir, se corrigiu uma escolha subótima após observar a consequência, se reaproveitou dados de missões anteriores).
   - Expor duas acções limpas no contexto global: `recordDecision(patch)` e `recordAdaptation(missionId, topic)` para registar efeitos sem acoplamento entre ecrãs.

2. **Sistema Reutilizável de Feedback e Avaliação Comportamental**:
   - Criar um pequeno conjunto reutilizável de utilitários/componentes:
     - **Gestor do Ciclo Pedagógico** para evitar duplicação de lógica entre missões: recebe o resultado da decisão (`optimal` | `suboptimal-recoverable`), dispara o som adequado, actualiza a memória comportamental e seleciona mensagens **curtas e variadas** de ASTRO (evitando repetir sempre o mesmo texto).
     - **Cartão Compacto de Consequência Visual** (usado dentro dos laboratórios da M1 e nos painéis de estado da M4/M5) para mostrar fisicamente o efeito (barra térmica, nível de água turva/limpa, vitalidade da planta) em vez de textos longos.
     - **Resumo Comportamental no Diário / Ecrã de Vitória de Missão**: em vez de notas de teste, o painel de conclusão mostra conquistas observadas na prática (ex.: *"Explorou 3 zonas antes de construir"*, *"Adaptou o sistema de rega ao solo de 8%"*, *"Reutilizou água purificada da Missão 4"*).

3. **Melhorias Físicas na Cena 3D (`SpaceViewport3D` & Modelos)**:
   - Estender as propriedades visuais opcionais de `WorldPropDef` (ex.: `tiltAngleRad` para módulos construídos em terreno inclinado na M3, `waterQuality: 'raw' | 'clean'` para o tanque 3D da M4, e `plantStress: 'dry' | 'healthy' | 'flooded'` para o biodomo da M5).
   - Isto garante que toda a consequência decidida pelo jogador tem **reflexo imediato no mundo 3D** além da interface!

---

## 5. FASES 4 e 5 — Plano de Implementação Incremental e Validação

Após a tua aprovação deste plano, a execução será feita **uma missão de cada vez**, compilando e validando cada etapa:

1. **Base Partilhada**: Tipos da memória de campanha, acções de decisão no contexto global, utilitário de feedback variado do ASTRO e novos estados visuais 3D (`tiltAngleRad`, `waterQuality`, `plantStress`).
2. **Missão 1**: Adicionar as mini-experiências de consequência e correcção nas 5 bancadas (material térmico, filtro de partículas, posicionamento livre do repetidor no relevo, teste de captação de 3s e vaso experimental de solo) ligando os resultados à memória da campanha.
3. **Missão 2**: Integrar os efeitos herdados da Missão 1 (isolamento/filtro), janela de preparação contra a tempestade com danos reversíveis na estufa/luzes e explicações contextuais de causa-efeito do ASTRO ao gerir energia.
4. **Missão 3**: Adicionar bateria física ao rover dependente da inclinação (com recarga solar segura), leitura geológica das amostras e colocação livre dos 4 módulos com **inclinação 3D visível** em declives + botão/clique de relocalização para o planalto plano.
5. **Missão 4**: Permitir instalação e mudança livre do extrator com captação proporcional real e distinguir visualmente **água bruta turva** vs. **água purificada potável**, gravando a reserva para a Missão 5.
6. **Missão 5**: Ligar a reserva hídrica da Missão 4, simular estados visuais reais das plantas para **8% / 32% / 45%** (secura, equilíbrio e encharcamento) com rega/drenagem corrigíveis em tempo real e resumo comportamental sem questionários.
7. **Validação Final**: Verificação das 8 perguntas de qualidade educativa da secção 12 em todas as missões, compilação (`npm run build`), validação TypeScript (`tsc --noEmit`) e teste interativo.
