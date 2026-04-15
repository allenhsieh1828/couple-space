# Couple Space

情侶共用系統，提供行事曆、帳本、待辦事項、留言板、集點卡與紀念日功能。

## 技術棧

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **Deployment**: Vercel

## 常用指令

```bash
npm run dev      # 啟動開發伺服器 http://localhost:3000
npm run build    # 建置生產版本
npm run lint     # 執行 ESLint
```

## 專案結構

```
src/
├── app/
│   ├── (auth)/       # 登入/註冊頁面
│   ├── calendar/     # 共用行事曆
│   ├── budget/       # 共同基金帳本
│   ├── todos/        # 待辦事項
│   ├── board/        # 留言板
│   ├── points/       # 集點卡
│   └── page.tsx      # 首頁（交往天數、紀念日）
├── components/
│   ├── ui/           # shadcn/ui 元件
│   └── shared/       # 共用元件
├── lib/
│   ├── supabase/     # Supabase client
│   └── utils.ts      # 工具函式
└── types/            # TypeScript 型別定義
```

## 功能模組

| 功能 | 路徑 | 說明 |
|------|------|------|
| 首頁 | `/` | 交往天數、紀念日倒數、今日摘要 |
| 行事曆 | `/calendar` | 共用日曆，即時同步 |
| 帳本 | `/budget` | 共同基金收支，圖表統計 |
| 待辦 | `/todos` | 個人/共同 TODO |
| 留言板 | `/board` | 即時留言 |
| 集點卡 | `/points` | 自訂獎勵、累積點數 |

## 程式規範

- 使用 async/await，不用 callback
- 元件一律用 function component + TypeScript
- 型別明確定義，不使用 any
- Server Components 為預設，互動元件才加 'use client'
- 不在 Client Component 直接操作 Supabase（透過 API routes）
- min-h-[100dvh] 取代 h-screen（避免 iOS Safari 跳版）

## UI / 設計規範

- 使用 shadcn/ui 元件為基礎
- 視覺風格溫暖、精緻、帶有情侶氛圍
- 主色調：柔和暖色系（米白、玫瑰粉、深棕）
- 不使用 emoji 在程式碼或 UI 文字中
- 響應式優先，支援手機瀏覽

## UI Skills 使用方式

開發 UI 時可呼叫以下 Skills 提升視覺品質：

- /frontend-design — 生成精緻、有個性的前端介面，避免通用 AI 美感
- /taste — 高品味 UI/UX 風格，有 DESIGN_VARIANCE / MOTION / DENSITY 參數控制
- /ui-ux-pro-max — 全方位 UI/UX，含字體配對、色彩系統、動效建議
- /impeccable — 精緻細節微調

## Supabase 使用規範

- 使用 @supabase/ssr 處理 Server/Client 端分離
- RLS (Row Level Security) 必須啟用
- 所有資料表需有 user_id 或 couple_id 欄位做權限隔離

## 安全規範

- .env.local 絕對不能 commit
- API 金鑰只放環境變數，不寫死在程式碼
- 所有資料操作都需驗證使用者身份
