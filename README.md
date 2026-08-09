
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

