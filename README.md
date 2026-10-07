# 팔레트 미술 스튜디오

작품 포트폴리오 · 피드백 · 전시 준비를 관리하는 미술학원

An original operational sample inspired by publicly described academy workflows, not affiliated with On-hi.

## Run locally

Requires Node 22.19+. Run npm ci, set APP_PASSWORD to a strong app password, then npm run dev. Open http://127.0.0.1:3100 and use admin / your APP_PASSWORD. Local SQLite receives fictional sample records.

## Deploy

Fork this repository and submit it to the academy catalog. It provisions Turso Tokyo and deploys Vercel Seoul. Schemas come from immutable prisma/migrations SQL. Remote apps start empty unless demo data was explicitly imported. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for manual hosting; provision schema before starting. Never put tokens in client code.

## Included workflows

- 원생: 원생과 보호자의 연락처를 한곳에서 관리해요.
- 워크숍: 재료와 주제를 정하고 함께 만드는 수업을 계획해요.
- 작품 포트폴리오: 작품의 과정과 완성, 선생님의 피드백을 차곡차곡 모아요.
- 전시 준비: 전시 일정과 장소, 준비할 일을 함께 기록해요.
- 공지: 학부모에게 전달할 내용을 정리해요. 실제 알림은 발송되지 않아요.

The public example is read-only. Downloaded apps support persisted registration and status actions. Notices are stored locally in the app, not delivered as SMS/push. Tuition is manual bookkeeping, not a payment gateway. Portfolio images are optional HTTPS references, not file uploads. This sample uses a single shared owner password; separate parent accounts and role permissions are not included.

## Checks

npm run lint
npm run typecheck
npm test
npm run build
