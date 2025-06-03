# supabase

## supabase start

`supabase start`を実行すると、ローカルに環境が作られる。
ローカルマシン上で Supabase スタック（PostgreSQL データベース、Supabase Studio UI、ローカル Edge Functions など）を起動します。開発やテストに便利です。

## supabase login

`supabase login`コマンドを実行すると、browser が立ち上がって supabase へのログインが促される。
これで cli 上でもログインした状態となる。

## supabase link

`supabase link`コマンドを実行すると、supabase の project と、現在の cli の向き先を結びつけられる。

## supabase migration up

`supabase migration up`を実行すると、ローカルの db に反映される。

## supabase migration list

`supabase migration list`を実行すると、どの環境に反映されてるかわかる。

本番環境のパスワードを要求されるので、SUPABASE_DB_PASSWORD 環境変数に値を入れておく。

## supabase db push

ローカルデータベーススキーマの現在の状態（または指定されたスキーマファイル）をリモートデータベースにプッシュします。注意：このコマンドはマイグレーション履歴をバイパスする可能性があるため、本番環境への直接の使用は慎重に行うべきです。本番環境には `supabase migration up` を使ってマイグレーションを順次適用することを推奨します。主にローカル開発や、リモートの開発・ステージング環境を素早く更新・リセットするのに適しています。

---

# supabase functions new ~~

新しい supabase functions を作成するときに使用する。

# supabase functions deploy

本番環境に supabase functions をデプロイする。
