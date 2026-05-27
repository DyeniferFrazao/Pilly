<p align="center">
  <img src="assets/icons/icon.png" alt="Pilly Logo" width="120"/>
</p>

<h1 align="center">💊 Pilly</h1>

<p align="center">
  <b>Aderência medicamentosa com gamificação e presença comunitária anônima</b><br/>
  Transforme a necessidade de tomar remédio em uma missão diária com recompensas divertidas.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

---

## 📋 Sobre o Projeto

O **Pilly** é um aplicativo mobile de aderência medicamentosa que combina gestão de remédios com um sistema de gamificação entre usuários reais. O diferencial não está no lembrete — está na motivação: XP, sequências de dias, conquistas e um ranking público anônimo criam o senso de pertencimento e consistência que apps tradicionais geralmente não costumam oferecer.

Desenvolvido como projeto acadêmico na **Universidade de Passo Fundo (UPF)** — Laboratório de Engenharia de Software.

### O problema real

Apps de lembrete de remédio resolvem o problema errado. O usuário não esquece porque não tem um alarme — esquece porque **o contexto quebrou**: não comeu ainda, quer dormir mais tarde, saiu da rotina. Além disso, tratar adesão como binário (tomou/não tomou) ignora a dimensão humana do hábito.

### A proposta

O Pilly trata aderência como **padrão comportamental**, não como alarme. Cada dose marcada gera XP. Dias consecutivos constroem streak. Conquistas desbloqueiam itens cosméticos para o avatar — recompensas visíveis e pessoais, não apenas números abstratos. Um ranking público anônimo conecta os usuários pelo hábito compartilhado, sem expor identidades ou diagnósticos.

---

## ✨ Funcionalidades

### Gestão de medicamentos
- Cadastro completo: nome, tipo, dosagem, unidade, duração e horários
- Tipos suportados: comprimido, cápsula, líquido, gotas, injetável, pomada, adesivo
- Alarmes nativos com ações diretas da notificação (Tomei / Adiar 15 min)
- Edição e exclusão com cancelamento automático dos alarmes

### Gamificação por usuário
- **XP** acumulado a cada dose registrada (+10 XP por dose, +5 XP por dia de streak)
- **Streak** — sequência de dias consecutivos com ao menos uma dose tomada
- **Badges** desbloqueáveis: 3d, 7d, 14d, 30d de streak; 10 e 100 doses; mês perfeito
- **Itens cosméticos** *(em desenvolvimento)* — recompensas visuais para o avatar desbloqueadas por conquistas, criando o sentimento de recompensa real além do ranking

### Comunidade anônima
- **Ranking Pilly** — leaderboard público entre todos os usuários, ordenado por XP; cada usuário aparece pelo apelido (prefixo do e-mail), sem expor diagnósticos ou histórico
- **Presença anônima** — contador em tempo real de doses registradas na última hora, criando o senso de que outras pessoas estão fazendo o mesmo movimento ao mesmo tempo
- Nenhum dado médico é compartilhado — apenas métricas de hábito

### Calendário e progresso
- Calendário semanal de aderência com status por dia (completo / parcial / ausente / hoje)
- Anel de progresso circular do dia (doses tomadas / doses esperadas)
- Missões do dia — lista de medicamentos com checkbox de check-in direto

### Mapa e configurações
- Localização de farmácias próximas via mapa integrado
- Configuração de notificações por medicamento
- Gestão da conta: alteração de senha, logout, exclusão

---

## 🏗️ Arquitetura

O Pilly adota arquitetura **serverless com BaaS**, eliminando a necessidade de um backend próprio:

```
┌─────────────────────────┐
│   App Mobile            │
│   React Native + Expo   │
│                         │
│  ┌──────────────────┐   │
│  │ UI / Screens     │   │
│  ├──────────────────┤   │
│  │ Services Layer   │   │  ──► Supabase JS Client
│  ├──────────────────┤   │
│  │ Local Cache      │   │  ──► SQLite (expo-sqlite)
│  └──────────────────┘   │
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│   Supabase (BaaS)       │
│                         │
│  • Auth (JWT)           │
│  • PostgreSQL           │
│  • Row Level Security   │
│  • Realtime (presença)  │
└─────────────────────────┘
```

### Decisões de design
- **Offline-first**: dose registrada localmente e sincronizada quando há conexão
- **RLS (Row Level Security)**: cada usuário acessa apenas seus próprios dados; o leaderboard público usa uma tabela separada com política de leitura irrestrita para autenticados
- **Atualização otimista**: checkbox de dose responde instantaneamente na UI antes da confirmação do servidor
- **Sem backend próprio**: toda a lógica de negócio vive nos services do cliente ou em políticas do Supabase

---

## 🗃️ Modelo de Dados

| Tabela                | Descrição                                                          |
|-----------------------|--------------------------------------------------------------------|
| `perfis`              | Perfil único por conta (nome, foto) — criado automaticamente       |
| `medicamentos`        | Remédios cadastrados (nome, tipo, dose, horários, duração)         |
| `doses_historico`     | Registro de cada dose tomada ou adiada, com timestamp              |
| `gamificacao`         | XP, streak, total de doses e badges por usuário                    |
| `leaderboard_publico` | Ranking entre usuários: apelido, XP, streak — leitura pública      |

### Segurança (RLS)
- Todas as tabelas com dados pessoais (`perfis`, `medicamentos`, `doses_historico`, `gamificacao`) são restritas ao próprio `auth.uid()`
- `leaderboard_publico` permite **SELECT** para qualquer usuário autenticado, mas **INSERT/UPDATE** apenas para o próprio registro
- Nenhuma informação de saúde é exposta no leaderboard — apenas apelido e métricas de hábito

---

## 🎮 Sistema de Gamificação

```
Dose registrada
      │
      ├─► +10 XP
      │
      └─► Streak recalculado
               │
               ├─► Dia consecutivo? streak++
               │
               └─► Badge desbloqueado?
                        │
                        ├─► streak_3 / streak_7 / streak_14 / streak_30
                        ├─► doses_10 / doses_100
                        ├─► mes_perfeito
                        └─► 🚧 Item cosmético desbloqueado (roadmap)
```

### Recompensas cosméticas (roadmap)
A próxima camada do sistema de gamificação prevê itens cosméticos vinculados às conquistas: molduras de avatar, ícones exclusivos para o card do ranking, paletas de cor e outros elementos visuais. O objetivo é que o usuário sinta que ganhou **algo real e visível**, não apenas um número abstrato de XP — seguindo o modelo de jogos como Duolingo e Habitica, onde a recompensa visual sustenta o engajamento de longo prazo.

---

## 📱 Telas

| Tela               | Rota            | Descrição                                              |
|--------------------|-----------------|--------------------------------------------------------|
| Login / Cadastro   | `Login`         | Autenticação via Supabase Auth                         |
| Home               | `Home`          | Arena de usuários, calendário, progresso, missões      |
| Medicamentos       | `Medicamentos`  | Lista completa de remédios com edição e exclusão       |
| Adicionar Remédio  | `AddMedScreen`  | Formulário de cadastro com horários e alarmes          |
| Mapa               | `Map`           | Farmácias próximas                                     |
| Configurações      | `Setting`       | Notificações, conta, segurança                         |
| Minha Conta        | `UserSettings`  | E-mail, senha, exclusão de conta                       |

### Navegação inferior

```
[ Início ]  [ Mapa ]  [ + ]  [ Meds ]  [ Config. ]
               ↑
         Botão central elevado → Adicionar medicamento
```

---

## 🚀 Como Rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Conta no [Supabase](https://supabase.com/) com as tabelas migradas

### Instalação

```bash
git clone https://github.com/DyeniferFrazao/Pilly.git
cd Pilly
npm install
npx expo start
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/)
2. Copie a URL e a `anon key` para `src/lib/supabase.js`
3. Execute os SQLs de migração no SQL Editor do Supabase, nesta ordem:

```
gamification_migration.sql    → tabela gamificacao
leaderboard_migration.sql     → tabela leaderboard_publico
```

> As tabelas `perfis`, `medicamentos` e `doses_historico` devem existir previamente (schema original do CuidaBem/Pilly).

### Dispositivo

- **iOS**: Expo Go via QR Code (câmera do iPhone)
- **Android**: Expo Go via QR Code

> ⚠️ `expo-notifications` com ações (Tomei / Adiar) requer **development build** — o Expo Go suporta apenas notificações básicas.

---

## 🛠️ Tecnologias

| Tecnologia              | Uso                                                    |
|-------------------------|--------------------------------------------------------|
| React Native + Expo     | App mobile iOS e Android                               |
| Supabase                | Auth, banco PostgreSQL, RLS, Realtime                  |
| expo-notifications      | Alarmes e notificações com ações nativas               |
| expo-image-picker       | Foto de perfil                                         |
| expo-sqlite             | Cache local offline                                    |
| AsyncStorage            | Persistência leve de sessão (perfilId, perfilNome)     |
| @react-navigation/native| Navegação em stack                                     |
| react-native-maps       | Mapa de farmácias                                      |

---

## 📂 Estrutura do Projeto

```
Pilly/
├── App.js                        # Entrada: navegação + listener de notificações
├── assets/                       # Ícones e imagens
├── gamification_migration.sql    # SQL: tabela gamificacao
├── leaderboard_migration.sql     # SQL: tabela leaderboard_publico
└── src/
    ├── components/               # Componentes reutilizáveis
    │   ├── FooterNavigation.js   # Barra de navegação inferior
    │   ├── ModalComponent.js     # Modal de detalhe do medicamento
    │   └── InputComponent.js     # Campo de texto padronizado
    ├── contexts/
    │   └── AuthContext.js        # Estado global de autenticação
    ├── lib/
    │   ├── supabase.js           # Cliente Supabase configurado
    │   └── localDb.js            # Cache SQLite offline
    ├── pages/
    │   ├── Authentication/       # LoginScreen, SignUpScreen
    │   ├── Configuration/        # SettingScreen, NotificationScreen, AlarmScreen
    │   ├── Home/                 # HomeScreen (arena + missões + gamificação)
    │   ├── Map/                  # MapScreen
    │   ├── Medication/           # AddMedScreen, MedicamentosScreen
    │   └── UserManagement/       # UserSettings
    ├── routes/
    │   └── StackNavigator.js     # Definição de rotas autenticadas e públicas
    ├── services/
    │   ├── alarmService.js       # Agendamento e cancelamento de notificações
    │   ├── gamificationService.js# XP, streak, badges, leaderboard
    │   ├── medicService.js       # CRUD de medicamentos e doses
    │   └── profileService.js     # Perfil do usuário + auto-criação
    └── style/                    # StyleSheets compartilhados
```

---

## 📅 Cronograma

| Período       | Entrega                                                  |
|---------------|----------------------------------------------------------|
| Abr 2026      | Configuração do ambiente, adaptação iOS, integração      |
| Mai 2026      | Gamificação, leaderboard, redesign completo da interface |
| Jun 2026      | Refinamentos, itens cosméticos, entrega final            |
| **22/06/2026**| 🎯 **Versão final e documentação**                       |

---

## 👩‍💻 Autora

**Dyênifer Thaís Frazão**
Universidade de Passo Fundo – UPF · Laboratório de Engenharia de Software
📧 209933@upf.br

---

## 📄 Licença

Projeto acadêmico — todos os direitos reservados à autora. Entre em contato para informações sobre uso e distribuição.

---

<p align="center">
  Feito com 💙
</p>
