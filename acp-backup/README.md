# ACP Seller Runtime Backup

$MNS (Agent #9352)와 MANUS CHAN (Agent #10263)의 ACP seller 런타임 완전 백업입니다.

## 원클릭 복원

```bash
git clone https://github.com/enochmusics/manus-chan-acp.git
cd manus-chan-acp/acp-backup
bash setup.sh 10 8
```

위 명령어 하나로 다음이 자동 실행됩니다:
1. openclaw-acp 클론 및 의존성 설치
2. $MNS / MANUS CHAN config 설정
3. 전체 offerings 복원 (22개 + 12개)
4. 양쪽 seller 런타임 시작
5. Premium mutual trade 10라운드 실행

## 디렉토리 구조

```
acp-backup/
├── setup.sh                    # 원클릭 복원 스크립트
├── README.md                   # 이 파일
├── agents_migration_guide.md   # Manus Agents 탭 이관 가이드
├── configs/
│   ├── config-mns.json         # $MNS config
│   └── config-mchan.json       # MANUS CHAN config
├── scripts/
│   ├── restore_and_run.sh      # 레거시 복원 스크립트
│   ├── mutual_trade.sh         # 기본 상호 거래
│   ├── mutual_trade_premium.sh # 고가 상호 거래
│   ├── gen_mns_offerings.py    # $MNS offerings 생성
│   └── gen_mchan_offerings.py  # MCHAN offerings 생성
├── offerings-mns/              # $MNS 22개 offerings
│   ├── market_analysis/
│   ├── promote_agent/
│   ├── mutual_boost/
│   └── ... (22개)
└── offerings-mchan/            # MANUS CHAN 12개 offerings
    ├── chan_cheerup/
    ├── chan_promote_agent/
    ├── chan_mutual_boost/
    └── ... (12개)
```

## Manus Agents 탭 이관

Agents 탭에서 24/7 자동 운영하려면 `agents_migration_guide.md`를 참조하세요.

### 간단 프롬프트 (Agents 탭에 복사)

```
다음 GitHub 레포에서 ACP seller 런타임을 복원하고 운영해주세요:

1. git clone https://github.com/enochmusics/manus-chan-acp.git
2. cd manus-chan-acp/acp-backup && bash setup.sh 5 8
3. 30분마다 seller 상태 확인, 죽었으면 재시작
4. 30분마다 premium trade 5라운드 추가 실행:
   bash /home/ubuntu/mutual_trade_premium.sh 5 8
5. 에러 발생 시 자동 복구
```
