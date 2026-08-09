
① ユーザー(customer / owner / admin)がログインできる
② ログイン中の人の「role」を、サーバー側でいつでも確認できる
③ roleに応じて、見える画面・使える機能を出し分ける

<auth.ts>
①の「本人確認をする処理」そのもの。メール・パスワードをDBと照合する部分

<types/next-auth.d.ts>
②のために必要な準備。「roleという情報を、通行証(セッション)に含めていいよ」とTypeScriptに教えるためのもの

<app/api/auth/[...nextauth]/route.ts>
①の処理を、ブラウザからアクセスできる「窓口(URL)」として公開するためのもの

ブラウザ（ユーザー） ←→ 【サーバー: auth.ts, route.ts】 ←→ DB




<gitの使い方>

git status 現在の状態確認

git add . 追加する準備(.は今のフォルダ全部という意味)

git commit -m "..." ローカルに変更内容を保存(必ずどんな変更をしたのかコメントを書く)

git push  git hubに保存




[ユーザーが登録フォームに入力]
        ↓
[Server Action(サーバー側の処理)が受け取る]
        ↓
[パスワードを暗号化(bcrypt)]
        ↓
[DBに新しいUserとして保存]




✓ 環境構築(Node.js, Git, PostgreSQL, Next.js, Prisma)
✓ DB設計(User / Restaurant / Reservation + Auth.js用テーブル)
✓ シードデータ
✓ 店舗一覧の表示、予約フォーム(Create)
✓ 会員登録・ログイン(Auth.js v5、Credentials認証)
✓ ログイン中の人の情報を、正しく予約に紐付け
✓ role別の画面アクセス制御(customer / owner / admin)
✓ 店舗オーナー向けダッシュボード(自分の店舗の予約確認)
✓ 運営向けダッシュボード(統計、店舗の承認・却下)
✓ GitHubへの継続的な保存





ログアウト機能
店舗オーナーが店舗を登録する機能
ユーザーが自分の予約一覧を見る画面
予約のキャンセル機能