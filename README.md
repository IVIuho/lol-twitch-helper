# lol-twitch-helper

트위치 채팅을 연동한 대기열 관리 및 리그오브레전드 자동 초대

## 사전준비

1. [이거](https://dev.twitch.tv/docs/irc/authenticate-bot/#registering-your-bot) 따라서 애플리케이션 등록하기
2. OAuth 리디렉션 URL 메모, 등록 후 애플리케이션에서 클라이언트 ID와 클라이언트 시크릿을 메모
3. `static` 폴더의 `client_example.json`의 파일명을 `client.json`으로 변경 후 2에서 메모했던 값 저장
4. `client.json`에 있는 username에 트위치 id를 입력

## 실행

1. 롤 클라이언트 실행
2. `yarn`
3. `yarn start`
