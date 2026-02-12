# 0번 페이지 나머지 구현: GNB 수정 + 푸터 + 사이드바

## 완료된 작업

### 1. GNB 활성 메뉴 색상 수정
- **파일**: `app/core/components/navigation-bar.tsx`
- `getNavLinkClass` 함수에서 활성 텍스트 색상을 `text-[#181D27]` → `text-[#414651]`로 변경
- 모바일 Sheet 메뉴의 활성 상태도 동일하게 수정
- hover 색상도 `#414651`로 통일

### 2. 푸터 Figma 디자인 전면 수정
- **파일**: `app/core/components/footer.tsx`
- 배경: 라이트 white / 다크 `#181D27`
- 패딩: `pt-16 pb-20`
- 로고: NYANYANG (logo3.png), 높이 30px
- 회사 정보: 나냥 | 대표자 김보현 | 02-000-0000 | 사업자 등록번호 (16px, `#717680` / 다크 `#D5D7DA`)
- 주소: 서울시 00구 000길
- 저작권: © 2025 Nanyang. All rights reserved. (`#717680`)
- 구분선: `#E9EAEB` / 다크 `#333741`
- 하단 링크 (14px, `#535862` / 다크 `#D5D7DA`): 개인정보 처리방침 | 서비스 이용약관 | 환불 정책 | 청소년 보호 정책 | 채용문의 | Discord 아이콘
- 링크 구분선: `#A4A7AE` / 다크 `#414651`
- Discord 아이콘: inline SVG로 구현

### 3. 채팅 사이드바 새로 구현
- **파일**: `app/core/components/chat-sidebar.tsx`
- 너비: 260px, 전체 높이
- 배경: 라이트 white / 다크 `#181D27`

#### 로그인 전
- "채팅" 헤더 (bold)
- 하단 CTA 카드: 로그인 유도 메시지
- 소셜 로그인: 카카오톡 + 구글 원형 버튼
- "이메일로 시작하기" 아웃라인 버튼

#### 로그인 후 - Default (채팅 없음)
- "채팅" 헤더
- "오늘" 섹션 헤더 + "0개" 카운트
- 빈 채팅 목록
- 하단: 유저 아바타 + 이름 + 이메일 + 로그아웃 아이콘

#### 로그인 후 - 채팅 있음
- "채팅" 헤더
- 섹션별 접기/펼치기 (Collapsible): "오늘", "최근 일주일", "이전"
- 각 섹션: N개 카운트 + ChevronDown 토글
- 채팅 아이템: 캐릭터 아바타(원형) + 이름(bold) + 날짜/시간(gray) + 더보기(⋮)
- 하단: 유저 아바타 + 이름 + 이메일 + 로그아웃 아이콘

### 4. 네비게이션 레이아웃 업데이트
- **파일**: `app/core/layouts/navigation.layout.tsx`
- `NavigationOutletContext` 인터페이스 export (user 정보 전달)
- `Outlet context`로 user 정보를 하위 라우트에 전달
- 채팅 화면에서 `useOutletContext<NavigationOutletContext>()`로 사용 가능

### 5. 채팅 화면에 사이드바 통합
- **파일**: `app/features/chat/screens/chat.tsx`
- `useOutletContext<NavigationOutletContext>()`로 유저 정보 수신
- loader에서 `allRooms` 추가 조회 (유저의 전체 채팅방 목록)
- `ChatSidebar`를 채팅 영역 왼쪽에 배치 (`lg:block`으로 데스크톱만 표시)
- 높이: `h-[calc(100vh-57px)]`로 GNB 높이 제외
