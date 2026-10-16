# 🇲🇩 MONOPOLY: Chișinău & Moldova Edition

A full-featured, real-time multiplayer **Monopoly** web game themed around **Chișinău and the Republic of Moldova**, built with a **Go (Golang)** WebSocket backend and a **React + TypeScript + Tailwind CSS** frontend.

---

## ✨ Features

### 🎲 Complete Classic Monopoly Rules
- **40 Authentic Board Tiles**: Every street, sector, transport hub, winery, utility, and tax tile is mapped to iconic Chișinău & Moldova locations.
- **Doubles & Speeding**: Roll two dice; rolling doubles grants an extra turn, while 3 consecutive doubles send you straight to **Penitenciarul Nr. 13 (CNA Detention)**!
- **Penitenciarul Nr. 13 (Jail)**: Exit by rolling doubles (up to 3 turns), paying the **50 MDL** bail (*Cauțiune*), or using a **"Scrisoare de la Cumătru"** (*Get Out of Jail Free* card).
- **Full Color Set (Monopoly) & Even Building**:
  - Owning all unmortgaged properties in a color group doubles base rent (`2x`).
  - Build up to **4 Houses/Chioșcuri** (`🏠`) and upgrade to a **Luxury Hotel/Vinărie** (`🏰`) following strict **Even Building & Even Selling** rules.
  - Classic bank scarcity: **32 Houses** and **12 Hotels**.
- **Public Auctions**: Declining to buy an unowned property triggers a live **Public Auction** where all solvent players (and AI bots) can bid in real time.
- **Mortgaging & Unmortgaging**: Mortgage unimproved properties for **50%** of their purchase price and unmortgage for **55%** (50% + 10% interest).
- **Player-to-Player Trading**: Propose trades offering or requesting MDL cash and properties.
- **Debt Resolution & Bankruptcy**: Raise funds by selling buildings or mortgaging properties before paying debts, or declare bankruptcy (*Plecat în Diaspora*).

### 🍇 Moldovan & Chișinău Cultural References
- **Multi-Language Switcher (`RO` / `EN` / `RU`)**: Instant live switching between Romanian, English, and Russian for the entire board, UI, game log, and card decks.
- **8 Moldovan Tokens**:
  - 🚎 **Troleibuzul 22** (*Trolleybus No. 22*)
  - 🥧 **Plăcintă Învârtită** (*Traditional Moldovan Plăcintă*)
  - 🍇 **Strugure de Moldova** (*Moldovan Grapes*)
  - 🍷 **Pahar de Purcari** (*Glass of Purcari Wine*)
  - 🎩 **Cușmă de Cârlan** (*Traditional Fur Hat*)
  - 🚐 **Rutiera 101** (*Marshrutka No. 101*)
  - 🌻 **Floarea-Soarelui** (*Moldovan Sunflower*)
  - 🎻 **Vioara Lăutarului** (*Lăutar Violin*)
- **16 "Noroc / Șansă" (Chance) & 16 "Cutia cu Cumătrie" (Community Chest) Cards**:
  - Parcel from Italy via minibus (*Colet din Italia cu cafea Lavazza*), Grand *Cumătrie* envelopes, Trolleybus poles popping off (*Au căzut coarnele la troleibuz*), *Moldova IT Park* 7% tax dividends, *Ziua Vinului* prizes, winter heating bills, and *Mărțișor* luck.
- **Smart AI Bots**: Add AI *Cumătri* (*Cumătrul Ion 🤖*, *Nanășul Vasile 🤖*, *Tanti Zina 🤖*, *Șoferul de pe 22 🤖*) to play solo or fill multiplayer rooms.

---

## 🗺️ The 40 Tiles of Chișinău & Moldova

| Color / Type | Tiles |
| :--- | :--- |
| **Brown (Outskirts)** | `1` Otovasca & Petricani · `3` Poșta Veche |
| **Light Blue (Ciocana & Buiucani)** | `6` Bd. Mircea cel Bătrân · `8` Strada Alba Iulia · `9` Valea Morilor & Dendrariu |
| **Pink (Bazaar & Telecentru)** | `11` Piața Centrală · `13` Calea Ieșilor & Fabrica Bucuria · `14` Telecentru & Mălina Mică |
| **Orange (Rîșcani)** | `16` Bulevardul Moscova · `18` Strada Kiev & Circul · `19` Piața Alecu Russo & Pan-Com |
| **Red (Botanica)** | `21` Porțile Orașului · `23` Bulevardul Dacia & ZOO · `24` Valea Trandafirilor & MallDova |
| **Yellow (Patrimony & Tourism)** | `26` Orheiul Vechi & Butuceni · `27` Cetatea Soroca · `29` Castel Mimi & Vinăria Purcari |
| **Green (Underground Wine Cities)** | `31` Strada Pietonală Eugen Doga · `32` Beciurile Cricova · `34` Mileștii Mici (Colecția de Aur) |
| **Dark Blue (Kilometer Zero VIP)** | `37` Strada București & Ambasade · `39` Bd. Ștefan cel Mare și Sfânt |
| **Transports (200 MDL)** | `5` Troleibuzul Nr. 22 (RTEC) · `15` Rutiera 101 · `25` Gara Feroviară (Trenul Prietenia) · `35` Aeroportul Internațional (RMO) |
| **Utilities (150 MDL)** | `12` Premier Energy (Lumina) · `28` Apă-Canal & Moldovagaz |
| **Special & Taxes** | `0` START (Ziua de Salariu) · `4` Factura Termoelectrica & FISC · `10` Penitenciarul Nr. 13 · `20` Arcul de Triumf (Parcare Gratis) · `30` Reținut de CNA · `38` Nuntă Moldovenească de Lux |

---

## 🚀 Getting Started

### Prerequisites
- **Go** `1.22+`
- **Node.js** `18+` and **npm**

### 1. Start the Go Server
```bash
cd server
go run ./cmd/server
```
The server starts on `http://localhost:8080` (with WebSocket endpoint `ws://localhost:8080/ws` and REST endpoints `/api/rooms`, `/api/board`, `/api/health`).

### 2. Start the React + TypeScript Client
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser! You can open multiple browser tabs/windows to play human-vs-human multiplayer or click **"+ Adaugă Cumătru (Bot AI)"** in the lobby to play with AI bots.

### Running Backend Unit Tests
```bash
cd server
go test -v ./...
```
