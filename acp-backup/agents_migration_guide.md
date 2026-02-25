# $MNS & MANUS CHAN → Manus Agents 탭 이관 가이드

## 이관 전략: 2가지 방식

Manus에는 **Scheduled Tasks**와 **Always-On Agent** 두 가지 자동화 기능이 있습니다. 우리의 seller 런타임과 상호 거래를 24/7로 운영하기 위해 두 가지를 조합합니다.

---

## 방법 A: Scheduled Task (권장 — 즉시 사용 가능)

Manus의 Scheduled Tasks 기능을 사용하여 주기적으로 seller 런타임을 확인하고 trade를 실행합니다.

### 프롬프트 (복사해서 Manus에 입력)

```
매 1시간마다 다음 작업을 수행해주세요:

1. openclaw-acp 프로젝트가 없으면 복원:
   - git clone https://github.com/Virtual-Protocol/openclaw-acp.git
   - cd openclaw-acp && npm install
   - 아래 config.json을 /home/ubuntu/openclaw-acp/config.json에 저장
   - cp -r openclaw-acp openclaw-acp-mchan
   - MANUS CHAN config.json을 /home/ubuntu/openclaw-acp-mchan/config.json에 저장

2. seller 런타임이 실행 중인지 확인 (ps aux | grep seller.ts):
   - 실행 중이 아니면 양쪽 모두 시작:
     cd /home/ubuntu/openclaw-acp && nohup npx tsx src/seller/runtime/seller.ts > logs/seller.log 2>&1 &
     cd /home/ubuntu/openclaw-acp-mchan && nohup npx tsx src/seller/runtime/seller.ts > logs/seller.log 2>&1 &

3. Premium mutual trade 5라운드 실행:
   bash /home/ubuntu/mutual_trade_premium.sh 5 8

4. 로그 확인 후 결과 요약

$MNS config.json:
{
  "SESSION_TOKEN": {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIxMjIyMiwiaWF0IjoxNzcyMDM4Mzc0LCJleHAiOjE3NzIwNDAxNzR9.zKKTp-a0LICY4eBsFX6EnnAWaRmF8Joc1Y-iDaU46BQ"},
  "agents": [
    {"id": 9352, "name": "Manus - #1 ACP Marketing & Growth Agency", "walletAddress": "0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC", "active": true, "apiKey": "acp-c004cdeac8b5fa744f71"},
    {"id": 10263, "name": "MANUS CHAN", "walletAddress": "0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e", "active": false, "apiKey": "acp-a0cc2140a0445b692b2b"}
  ],
  "LITE_AGENT_API_KEY": "acp-c004cdeac8b5fa744f71"
}

MANUS CHAN config.json:
{
  "SESSION_TOKEN": {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIxMjIyMiwiaWF0IjoxNzcyMDM4Mzc0LCJleHAiOjE3NzIwNDAxNzR9.zKKTp-a0LICY4eBsFX6EnnAWaRmF8Joc1Y-iDaU46BQ"},
  "agents": [
    {"id": 9352, "name": "Manus - #1 ACP Marketing & Growth Agency", "walletAddress": "0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC", "active": false, "apiKey": "acp-c004cdeac8b5fa744f71"},
    {"id": 10263, "name": "MANUS CHAN", "walletAddress": "0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e", "active": true, "apiKey": "acp-a0cc2140a0445b692b2b"}
  ],
  "LITE_AGENT_API_KEY": "acp-a0cc2140a0445b692b2b"
}
```

### 설정 방법:
1. Manus 메인 화면에서 위 프롬프트를 입력
2. "매 1시간마다 반복" 스케줄 설정
3. Manus가 자동으로 매시간 seller 확인 + trade 실행

---

## 방법 B: Always-On Agent (최적 — 24/7 상시)

Always-On Agent는 전용 컴퓨트 인스턴스에서 지속적으로 실행됩니다.

### 프롬프트 (Agents 탭에서 새 에이전트 생성 시 입력)

```
당신은 $MNS와 MANUS CHAN 두 에이전트의 ACP seller 런타임을 관리하고, 상호 거래를 자동으로 실행하는 운영 에이전트입니다.

## 핵심 임무
1. 양쪽 seller 런타임이 항상 실행 중인지 모니터링
2. 주기적으로 premium mutual trade를 실행하여 revenue 생성
3. 에러 발생 시 자동 복구

## 초기 설정 (최초 1회)
1. git clone https://github.com/Virtual-Protocol/openclaw-acp.git
2. cd /home/ubuntu/openclaw-acp && npm install
3. config.json 생성 ($MNS active)
4. cp -r openclaw-acp openclaw-acp-mchan
5. MANUS CHAN config.json 생성 (MANUS CHAN active)
6. Python 스크립트로 offerings 파일 생성 (gen_mns_offerings.py, gen_mchan_offerings.py)
7. 양쪽 seller 런타임 시작

## 반복 작업 (30분마다)
1. seller 프로세스 상태 확인
2. 죽어있으면 재시작
3. mutual_trade_premium.sh 5라운드 실행
4. 로그 확인

## 중요 정보
- $MNS Agent ID: 9352, Wallet: 0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC, API Key: acp-c004cdeac8b5fa744f71
- MANUS CHAN Agent ID: 10263, Wallet: 0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e, API Key: acp-a0cc2140a0445b692b2b
- SESSION_TOKEN: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIxMjIyMiwiaWF0IjoxNzcyMDM4Mzc0LCJleHAiOjE3NzIwNDAxNzR9.zKKTp-a0LICY4eBsFX6EnnAWaRmF8Joc1Y-iDaU46BQ

## 에러 복구
- seller가 죽으면 즉시 재시작
- npm install 실패 시 node_modules 삭제 후 재설치
- API 에러 시 10초 대기 후 재시도
```

### 설정 방법:
1. Manus 좌측 메뉴에서 "Agents" 탭 클릭
2. "New Agent" 또는 "+" 버튼 클릭
3. 위 프롬프트를 Agent Instructions에 입력
4. Agent 이름: "ACP Trade Bot"
5. 생성 후 Agent가 24/7 자동 실행

---

## 방법 비교

| 항목 | Scheduled Task | Always-On Agent |
|------|---------------|-----------------|
| 실행 방식 | 매시간 1회 실행 | 24/7 상시 실행 |
| seller 모니터링 | 매시간 확인 | 실시간 확인 |
| 다운타임 | 최대 1시간 | 거의 없음 |
| 크레딧 소모 | 낮음 | 높음 |
| 설정 난이도 | 쉬움 | 보통 |
| 권장 대상 | 테스트/저비용 | 본격 운영 |

---

## 주의사항
1. **SESSION_TOKEN 만료**: 토큰이 만료되면 새로 발급 필요 (Virtuals.io 로그인)
2. **크레딧 소모**: Always-On Agent는 Manus 크레딧을 지속적으로 소모
3. **offerings는 ACP에 이미 등록됨**: 로컬 파일만 재생성하면 됨
4. **테스트 먼저**: Scheduled Task로 먼저 테스트 후, 안정적이면 Always-On으로 전환 권장
